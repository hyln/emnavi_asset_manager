import net from 'net';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { promisify } from 'util';
import { Queue } from 'async-await-queue';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

type Meta = {
    filename: string;
    total_parts: number;
    md5: string;
    file_id: string;
};

export class MultiPortUploader {
    serverIp: string;
    ports: number[];
    chunkSize: number;
    retryLimit: number;

    constructor(serverIp: string, ports: number[], chunkSize = 4 * 1024 * 1024, retryLimit = 3) {
        this.serverIp = serverIp;
        this.ports = ports;
        this.chunkSize = chunkSize;
        this.retryLimit = retryLimit;
    }

    static async fileMd5(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('md5');
            const stream = fs.createReadStream(filePath);
            stream.on('data', chunk => hash.update(chunk));
            stream.on('end', () => resolve(hash.digest('hex')));
            stream.on('error', reject);
        });
    }

    async splitFileToChunks(filePath: string): Promise<Buffer[]> {
        const { size } = await stat(filePath);
        const chunks: Buffer[] = [];
        const fd = await fs.promises.open(filePath, 'r');
        let offset = 0;
        while (offset < size) {
            const toRead = Math.min(this.chunkSize, size - offset);
            const buf = Buffer.alloc(toRead);
            await fd.read(buf, 0, toRead, offset);
            chunks.push(buf);
            offset += toRead;
        }
        await fd.close();
        return chunks;
    }

    static makeMeta(filename: string, totalParts: number, md5: string, uploadId: string): Meta {
        return {
            filename: path.basename(filename),
            total_parts: totalParts,
            md5,
            file_id: uploadId,
        };
    }

    async sendPacket(
        port: number,
        seq: number,
        payloadBytes: Buffer,
        metaJson: string
    ): Promise<boolean> {
        return new Promise((resolve) => {
            const metaB = Buffer.from(metaJson, 'utf-8');
            const metaLen = metaB.length;
            const payload = Buffer.concat([
                Buffer.alloc(4),
                metaB,
                payloadBytes,
            ]);
            payload.writeUInt32BE(metaLen, 0);

            const payloadLen = payload.length;
            const hdr = Buffer.alloc(8);
            hdr.writeUInt32BE(seq, 0);
            hdr.writeUInt32BE(payloadLen, 4);

            const client = new net.Socket();
            client.connect(port, this.serverIp, () => {
                client.write(Buffer.concat([hdr, payload]));
                client.end();
                // resolve(true);
                // client.end(() => {
                //     resolve(true); // 真正等 end 事件再返回
                // });

            });
            client.on('close', () => {
                resolve(true);
            });

            client.on('error', (err) => {
                console.error(`[!] sendPacket error port=${port} seq=${seq} -> ${err}`);
                resolve(false);
            });
        });
    }
    async sendFile(
        filePath: string,
        uploadId: string
    ): Promise<{ md5: string; totalParts: number; emitter: EventEmitter }> {
        const emitter = new EventEmitter();
        const md5 = await MultiPortUploader.fileMd5(filePath);
        const chunks = await this.splitFileToChunks(filePath);
        const totalParts = chunks.length;

        // 在独立的异步任务中跑上传
        (async () => {
            try {
                let uploadedChunks = 0;
                const meta = MultiPortUploader.makeMeta(filePath, totalParts, md5, uploadId);
                const metaJson = JSON.stringify(meta);

                // 任务队列
                const taskQueue = chunks.map((chunk, index) => ({ chunk, index }));

                // worker: 每个端口一个任务循环，空了就取任务
                const worker = async (port: number) => {
                    while (taskQueue.length > 0) {
                        const task = taskQueue.shift();
                        if (!task) break;
                        const { chunk, index } = task;

                        let tries = 0;
                        let ok = false;
                        while (tries < this.retryLimit && !ok) {
                            console.log(`Sending chunk seq=${index} to port=${port}, try #${tries + 1}`);
                            ok = await this.sendPacket(port, index, chunk, metaJson);
                            if (!ok) {
                                tries++;
                                await new Promise((res) => setTimeout(res, 500));
                            }
                        }
                        if (!ok) throw new Error(`[!] Failed to send seq=${index} after ${this.retryLimit} tries`);

                        uploadedChunks++;
                        emitter.emit("progress", {
                            uploaded: uploadedChunks,
                            total: totalParts,
                            percent: (uploadedChunks / totalParts) * 100,
                        });
                        await new Promise((res) => setTimeout(res, 1000));
                    }
                };

                // 启动所有端口的 worker
                await Promise.all(this.ports.map((port) => worker(port)));

                emitter.emit("done", { success: true, uploadId, savedTo: filePath });
            } catch (err) {
                emitter.emit("error", err instanceof Error ? err : new Error(String(err)));
            }
        })();

        // 立刻返回 emitter，外面能注册监听
        return { md5, totalParts, emitter };
    }
}

export class ControlClient {
    baseUrl: string;

    constructor(serverHost: string, serverPort = 6000) {
        this.baseUrl = `http://${serverHost}:${serverPort}`;
    }

    async startUpload(filename: string, size: number, remoteFilePath: string, auth_id: string): Promise<string> {
        const fileMd5 = await MultiPortUploader.fileMd5(filename);
        const uploadId = uuidv4();
        const resp = await axios.get(`${this.baseUrl}/start_upload`, {
            params: {
                upload_id: uploadId,
                size,
                remote_file_path: remoteFilePath,
                md5: fileMd5,
                auth_id
            },
        });
        const data = resp.data;
        if (data.status === 'ok') {
            return data.upload_id;
        } else {
            throw new Error(data.msg || 'Failed to create upload task');
        }
    }

    async listTasks(): Promise<any> {
        const resp = await axios.get(`${this.baseUrl}/list_tasks`);
        return resp.data;
    }
}

// Example usage (uncomment to use):
// (async () => {
//   const FILEPATH = '/home/hao/Downloads/stm32f722re.pdf';
//   const SERVER_IP = '110.42.45.189';
//   const client = new ControlClient(SERVER_IP);
//   const remoteFilePath = path.basename(FILEPATH);
//   const uploadId = await client.startUpload(FILEPATH, (await stat(FILEPATH)).size, remoteFilePath);
//   console.log('Got upload_id:', uploadId);
//   const tasks = await client.listTasks();
//   const PORTS = [5001, 5002, 5003, 5004, 5005];
//   const uploader = new MultiPortUploader(SERVER_IP, PORTS);
//   await uploader.sendFile(FILEPATH, uploadId);
//   console.log('Current tasks:', tasks);
// })();
// import * as dgram from 'dgram';
import { EventEmitter } from 'events';
import { Device } from './device';
const { Mutex } = require('async-mutex');
import * as dgram from 'dgram';

export class Discover extends EventEmitter {
    private discoveries: string[];
    private is_socket_ready: boolean = false;
    private devices: Device[] = [];
    private mutex = new Mutex();
    private socket: dgram.Socket;
    private listen_port: number;
    private local_addr: string;
    private send_addr: string;
    private send_port: number;

    constructor(listen_port: number, send_addr: string,send_port: number) {
        super();
        this.discoveries = [];
        this.listen_port = listen_port;
        this.local_addr = "0.0.0.0"; // 监听所有地址
        this.send_addr = send_addr; // 发送地址
        this.send_port = send_port; // 发送端口
        // create socket
        this.socket = dgram.createSocket('udp4');
        this.socket.on('error', (err) => {
            console.error('Socket error:', err);
            this.socket.close();
        });
        this.socket.bind(this.listen_port, this.local_addr, () => {
            console.log(`Socket bound to ${this.local_addr}:${this.listen_port}`);
            // socket.setBroadcast(true);
            this.socket.setMulticastTTL(1); // 通常 1 表示仅限本地子网
        })
        this.socket.on('listening', () => {
            console.log('Socket listening');
        });
        this.socket.on('close', () => {
            console.log('Socket closed');
            this.is_socket_ready = false;
        }
        );
        this.is_socket_ready = true;

        this.socket.on('message', async (msg, rinfo) => {
            console.log(`Received: ${msg} from ${rinfo.address}:${rinfo.port}`);
            const message = msg.toString();
            try {
              const deviceInfo = JSON.parse(message);
              const device = new Device(deviceInfo.mac, deviceInfo.device_name,deviceInfo.ip_addresses);
              const release = await this.mutex.acquire();
              try {
                const existingDevice = this.devices.find((d) => d.mac === device.mac);
                if (existingDevice) {
                  existingDevice.lastUpdated = Date.now();
                  existingDevice.mac = device.mac;
                  existingDevice.ips = device.ips;
                  existingDevice.deviceName = device.deviceName;
                }
              else {
                this.devices.push(device);
              }
        
              } finally {
                this.emit('update', this.devices);        
                release();
              }
            } catch (err) {
              console.error('Failed to parse message:', err);
            }
          });
    }

    sendDiscoverMessage() {
        console.log("Sending discover message to " + this.send_addr + ":" + this.send_port);
        if(this.is_socket_ready)
        {
          console.log("Sent: EMNAVI_DEV_DISCOV_REQ");
          const message = 'EMNAVI_DEV_DISCOV_REQ';
          this.socket.send(message, 0, message.length, this.send_port, this.send_addr, (err) => {
          if (err) {
            console.error('Failed to send UDP packet:', err);
          } else {
            // console.log('UDP packet sent successfully');
          }
        }); 
        }     
      }
}
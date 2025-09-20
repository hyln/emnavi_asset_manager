import http from 'http';
import url from 'url';
import net from 'net';

class EasyForward {
    private server: http.Server;
    private port: number;
    private host: string;

    constructor() {
        this.server = http.createServer();
        this.port = 16789;
        this.host = "0.0.0.0";
        this.server.on('request', this.handleHttpRequest.bind(this));
        this.server.on('connect', this.handleConnectRequest.bind(this));

    }

    private handleHttpRequest(clientReq: http.IncomingMessage, clientRes: http.ServerResponse): void {
        console.log(`HTTP request for: ${clientReq.method} ${clientReq.url}`);

        let parsedUrl;
        try {
            parsedUrl = url.parse(clientReq.url || '');
        } catch (e) {
            clientRes.writeHead(400);
            clientRes.end('Invalid URL');
            return;
        }

        if (!parsedUrl.hostname) {
            const hostHeader = clientReq.headers['host'];
            if (!hostHeader) {
                clientRes.writeHead(400);
                clientRes.end('Host header missing');
                return;
            }
            parsedUrl = url.parse(`http://${hostHeader}${clientReq.url}`);
        }

        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port ? Number(parsedUrl.port) : 80,
            path: parsedUrl.path,
            method: clientReq.method,
            headers: clientReq.headers,
        };

        const proxyReq = http.request(options, (proxyRes) => {
            clientRes.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
            proxyRes.pipe(clientRes, { end: true });
        });

        proxyReq.on('error', (err) => {
            console.error('Proxy HTTP request error:', err.message);
            clientRes.writeHead(500);
            clientRes.end(`Proxy error: ${err.message}`);
        });

        clientReq.pipe(proxyReq, { end: true });
    }

    private handleConnectRequest(req: http.IncomingMessage, clientSocket: net.Socket, head: Buffer): void {
        console.log('CONNECT url:', req.url);
        const parsedUrl = url.parse(`https://${req.url}`);

        if (!parsedUrl.hostname || !parsedUrl.port) {
            console.log('Bad request: no hostname or port');
            clientSocket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
            clientSocket.end();
            return;
        }

        const serverSocket = net.connect(Number(parsedUrl.port), parsedUrl.hostname, () => {
            console.log(`Connected to target ${parsedUrl.hostname}:${parsedUrl.port}`);
            clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
            serverSocket.write(head);
            serverSocket.pipe(clientSocket);
            clientSocket.pipe(serverSocket);
        });

        serverSocket.on('error', (err) => {
            console.error('Server socket error:', err);
            clientSocket.end();
        });
    }

    start(port,host): void {
        this.port = port;
        this.host = host;
        this.server.listen(this.port, this.host, () => {
            console.log(`Proxy server is running on ${this.host}:${this.port}`);
        });
    }

    stop(): void {
        this.server.close(() => {
            console.log('Proxy server stopped.');
        });
    }
}

export default EasyForward;
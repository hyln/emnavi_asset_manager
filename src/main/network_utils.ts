import * as dgram from 'dgram';
import { networkInterfaces } from 'os';
import ip from 'ip';

function createDiscoverSocket(listenPort: number, localAddr: string): dgram.Socket {
    const socket = dgram.createSocket('udp4');
    let isSocketReady = false;

    socket.on('error', (err) => {
        console.error('Socket error:', err);
        socket.close();
    });

    socket.bind(listenPort, localAddr, () => {
        console.log(`Socket bound to ${localAddr}:${listenPort}`);
        socket.setMulticastTTL(1); // 通常 1 表示仅限本地子网
    });

    socket.on('listening', () => {
        console.log('Socket listening');
    });

    socket.on('close', () => {
        console.log('Socket closed');
        isSocketReady = false;
    });

    isSocketReady = true;

    return socket;
}

function getIPv4Addresses(): { [iface: string]: string[] } {
  const interfaces = networkInterfaces();
  const result: { [iface: string]: string[] } = {};

  for (const [name, infos] of Object.entries(interfaces)) {
    if (!infos) continue;
    const ipv4s = infos
      .filter(info => info.family === 'IPv4' && !info.internal)
      .map(info => info.address);
    if (ipv4s.length > 0) {
      result[name] = ipv4s;
    }
  }

  return result;
}


function getNetcardSubnet() {
  let netcard_ips_: string[] = [];
  //应该是reload 后get，而不是只在第一次 
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      if (net.family === 'IPv4' && !net.internal) {
        const subnet = ip.subnet(net.address, net.netmask);
        const subnetWithMask = `${subnet.networkAddress}/${subnet.subnetMaskLength}`;
        // console.log(subnetWithMask);
        if (!netcard_ips_.includes(subnetWithMask)) {
          netcard_ips_.push(subnetWithMask);
        }
      }
    }
  }
  return netcard_ips_;
}



// 获取所有有效的广播地址
function findBroadcastIps(): string[] {
  const nets = networkInterfaces();
  let broadcastIps: string[] = [];
  // 遍历所有网络接口
  for (const iface in nets) {
    if (nets.hasOwnProperty(iface)) {  // 确保是对象自身的属性
      nets[iface]?.forEach((details) => {
        if (details.family === 'IPv4'&& details.netmask && details.address) {
          const ipAddress = details.address;
          const netmask = details.netmask;
          const broadcastAddress = ip.subnet(ipAddress, netmask).broadcastAddress;
          broadcastIps.push(broadcastAddress);

        }
      });
    }
  }
  return broadcastIps;
}

export { createDiscoverSocket, getNetcardSubnet, findBroadcastIps,getIPv4Addresses };
// Example usage:
// const socket = createSocket(LISTEN_PORT, LOCAL_ADDR);

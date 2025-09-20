// 假设设备的数据结构
type IPInfo = {
    interface: string;
    ip: string;
  };
class Device {
    mac: string;
    deviceName: string;
    ips: {};
    lastUpdated: number;
  
    constructor(mac: string, deviceName: string,ips: {}) {
      this.mac = mac;
      this.deviceName = deviceName;
      this.lastUpdated = Date.now();
      this.ips = ips;
    }
  }

export { Device };
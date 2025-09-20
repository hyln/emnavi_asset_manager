<template>
    <!-- <div> -->
    <!-- <h2 >设备列表</h2> -->
    <!-- <p class="note-text">提示： 使用usb连接请手动将笔记本ip调整到192.168.108.2，netmask 255.255.255.0,不设置网关</p> -->
    <!-- <el-button @click="loading = !loading">刷新</el-button> -->
    <!-- </div> -->

    <div class="table-container">
        <el-table v-loading="loading" ref="tableRef" :data="devicesList" row-key="mac" style="width: 95%;height: 80vh;"
            :row-class-name="rowClassName" @selection-change="handleSelectionChange">
            <!-- <el-table v-loading="loading" :data="wifiList" style="width: 100%;height: 84vh;" :row-class-name="rowClassName"> -->
            <el-table-column type="selection" width="30">
            </el-table-column>
            <el-table-column prop="deviceName" label="DEV NAME" width="180">
            </el-table-column>
            <el-table-column label="IP4-ADDRS" width="200">
                <template #default="scope">
                    <div v-for="(ip, inter) in scope.row.ips">
                        {{ inter }}: {{ ip }}
                    </div>
                </template>
            </el-table-column>
            <el-table-column label="状态" width="80">
                <template #default="scope">
                    <el-icon size="22" v-if="scope.row.onlineStatus == 'Online'" color="green">
                        <SuccessFilled />
                    </el-icon>
                    <el-icon size="22" v-else-if="scope.row.onlineStatus == 'Timeout'" color="#e36e40">
                        <WarningFilled />
                    </el-icon>
                    <el-icon size="22" v-else color="red">
                        <CircleCloseFilled />
                    </el-icon>
                </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
                <template #default="scope">
                    <div v-for="(ip, inter) in scope.row.ips">
                        <el-button v-if="getConnectAvailable(ip) && scope.row.onlineStatus == 'Online'"
                            @click="openWebPage(scope.row, ip)" type="primary"
                            style="width: 130px;margin-bottom: 3px;">连接 ({{ inter }})</el-button>
                        <!-- <div v-else>不可用</div> -->
                    </div>
                </template>
            </el-table-column>
        </el-table>
    </div>
    <!-- <div class="top-control-bar" style="display: flex; margin-bottom: 20px; margin-top: 15px;">
        <el-row :gutter="20">
            <el-col :span="8">
                <el-select v-model="forward_host" placeholder="选择网卡" style="width: 150px;">
                    <el-option v-for="ip in host_ips" :key="ip" :label="ip" :value="ip">
                    </el-option>
                </el-select>
            </el-col>
            <el-col :span="8">
                <el-button type="primary" @click="toggleForwarding">
                    {{ forwarding_flag ? '关闭网络转发服务' : '启动网络转发服务' }}
                </el-button>
            </el-col>
            <el-col :span="8">
                <el-input v-model="current_forward_host" readonly style="width: 150px;" placeholder="转发地址"></el-input>
            </el-col>
        </el-row>

    </div> -->

</template>
<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { SuccessFilled, WarningFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import axios from 'axios';
import { isInSubnet } from 'is-in-subnet';
import { de } from 'element-plus/es/locales.mjs';
import { ElNotification } from 'element-plus'

const devicesList = ref([]);
let selectedDevices = []; // 用于保存选中的设备
let ipRanges = [];


const host_sub = ref([]);
const host_ips = ref([]); // 用于保存网卡IP列表 
const loading = ref(false);
const tableRef = ref(null);

const forward_host = ref(''); // 用于保存选中的网卡IP
const forwarding_flag = ref(false);
const current_forward_host = ref(''); // 当前转发的网卡地址
function toggleForwarding() {
    if (!forwarding_flag.value) {
        if (!forward_host.value) {
            ElNotification.error({
                title: '请选择一个网卡',
                message: '请先选择一个网卡地址进行网络转发',
                position: 'bottom-right',
            });
            return;
        }
        current_forward_host.value = forward_host.value + ":16789"; // 更新当前转发地址
        forwarding_flag.value = !forwarding_flag.value;
        window.electronAPI.startForwarding(forward_host.value);
        ElNotification.success({
            title: '网络转发服务已启动',
            message: `当前转发地址: ${forward_host.value}`,
            position: 'bottom-right',
        });
        
    } else {
        // window.electronAPI.stopForwarding();
        ElNotification.info({
            title: '网络转发服务已关闭',
            message: '已停止网络转发服务',
            position: 'bottom-right',
        });
        forwarding_flag.value = !forwarding_flag.value;
        window.electronAPI.stopForwarding();
    }
}



// 用一个对象来管理所有的打开的窗口
let windows = {};
const close_warning = (device) => {
    ElNotification.warning({
        title: '连接超时',
        dangerouslyUseHTMLString: true,
        message: '<p>1 若您切换了网络连接，请重新连接 </p> <p>2 否则请检查设备是否在线</p>',
        position: 'bottom-right',
    })
}
const close_windows = (device) => {
    const window_id = device.mac;
    if (windows[window_id]) {
        setTimeout(close_warning, 500);//直接调用会导致close_warning函数无法执行
        windows[window_id].destroy();
        delete windows[window_id];
    }
}

function getConnectAvailable(ip) {
    if (isIpInRange(ip)) {
        return true;
    }
    return false;
}
function getOnlineStatus(device, ip_ranges = ipRanges) {
    const now = Date.now(); // 获取当前时间的 UNIX 时间戳（ms）  
    let online = false;
    for (const inter in device.ips) {
        if (isIpInRange(device.ips[inter])) {
            online = true;
        }
    }
    // console.log(now - device.lastUpdated);
    if (now - device.lastUpdated < 8000 && online) {
        return 'Online'
    }
    else if (now - device.lastUpdated < 16000) {
        return 'Timeout'
    }
    else {
        // close_windows(device);
        // close_warning(device);
        return 'Offline'
    }
}
onMounted(() => {

    // setInterval(updateOnlineStatus, 2000); // 每2秒调用一次
});

const updateOnlineStatus = () => {
        devicesList.value.forEach((device) => {
            device.onlineStatus = getOnlineStatus(device);
        });
    };
// 监听选中项变化
function handleSelectionChange(selection) {

    console.log("handleSelectionChange", selection);
    selectedDevices = selection.map(item => ({ ...item }));
    console.log("selectedDevices", selectedDevices);
}

window.electronAPI.onUpdateNetDevices((value) => {
    const oldDevicesList = devicesList.value;
    const selectedMacs = selectedDevices;
    console.log("onUpdateNetDevices", value);
    devicesList.value = JSON.parse(value);
    devicesList.value.forEach((device) => {
        device.onlineStatus = getOnlineStatus(device);
    });
    nextTick(() => {
        selectedMacs.forEach((selected) => {
            const match = devicesList.value.find(d => d.mac === selected.mac);
            if (match && tableRef.value) {
                tableRef.value.toggleRowSelection(match, true);
            }
        });
    });
});

// window.electronAPI.onDiscoverSend((value) => {
//     console.log("onDiscoverSend", value);
//     loading.value = true;
//     error.value = null;
// });

window.electronAPI.onUpdateNetcardIpsSub((value) => {
    ipRanges = JSON.parse(value);
    let ipRanges_list = typeof value === 'string' ? JSON.parse(value) : value;
    console.log("onUpdateNetcardIpsSub", value);
    host_sub.value = ipRanges_list.map(ipRange => ipRange.split('/')[0]);
    console.log("host_sub", host_sub.value);
    updateOnlineStatus(); 
})
window.electronAPI.onUpdateNetcardIps((value) => {
    console.log("onUpdateNetcardIps", value);
    let ipObj = JSON.parse(value); // 是一个对象，不可直接 for...of

    // 取所有 IP 并扁平化为一个数组：
    let ipList = Object.values(ipObj).flat();

    for (const ip of ipList) {
    if (!host_ips.value.includes(ip)) {
        host_ips.value.push(ip);
    }
    }
    console.log("host_ips", host_ips.value);


    // host_ips.value = ipList.map(item => item.ip);
    // console.log("host_ips", host_ips.value);

    // ipRanges = JSON.parse(value);
    // let ipRanges_list = typeof value === 'string' ? JSON.parse(value) : value;
    // host_sub.value = ipRanges_list.map(ipRange => ipRange.split('/')[0]);
    // console.log("host_sub", host_sub.value);
    // updateOnlineStatus(); 
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'F5' || (event.ctrlKey && event.key === 'r') || (event.metaKey && event.key === 'r')) {
        event.preventDefault();
    }
});
function openWebPage(device, ip) {
    const window_id = device.mac; // 每个窗口有唯一的ID，避免冲突
    const window_name = device.deviceName

    console.log("open page " + ip);
    // // 或者传递更复杂的参数：
    const newWindowOptions = {
        title: window_name,
        width: 800,
        height: 600,
        window_id: window_id,
        // autoHideMenuBar: true,
        loadURL: 'http://' + ip,
        autoHideMenuBar: true,
        // loadFile: 'new_window.html' // 加载本地文件
    };

    window.electronAPI.openNewWindowWithOptions(newWindowOptions);
};

const isIpInRange = (ip) => {
    return isInSubnet(ip, ipRanges)
}

const rowClassName = ({ row }) => {
    // console.log(row.active == 'yes' ? 'success-row' : '');
    return row.active == 'yes' ? 'success-row' : ''; // 如果 active 不是 'yes'，则返回高亮类
};

</script>

<style>
.el-table .success-row {
    /* --el-table-tr-bg-color: var(--el-color-warning-light-9); */
    --el-table-tr-bg-color: #45553d96;
}

.note-text {
    font-family: 'Noto_Sans_TC', sans-serif;
    /* 确保 YourCustomFont 是你 @font-face 中定义的名称 */
    font-size: 15px;
    text-align: center;
    color: #cec1c1;
}

.table-container {
    width: 700px;
    /* 设置表格容器的宽度 */
    margin: 0 auto;
    /* 左右自动 margin 实现水平居中 */
}
</style>
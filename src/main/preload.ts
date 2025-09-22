import {contextBridge, ipcRenderer} from 'electron';
import { on } from 'events';
import { check } from 'is-in-subnet';
import { onUpdated } from 'vue';

contextBridge.exposeInMainWorld('electronAPI', {
    requestAuth: (code: string) => ipcRenderer.invoke('request-auth', code),
    checkIsLogin: () => ipcRenderer.invoke('check-is-login'),
    fetchItems: (path: string) => ipcRenderer.invoke('fetch-items', path),
    createFolder: (path: string, name: string) => ipcRenderer.invoke('create-folder', path, name),
    selectFile: () => ipcRenderer.invoke('select-file'),
    uploadFile: (filePath: string, taskId: string) => ipcRenderer.invoke('upload-file', filePath, taskId),
    uploadClipboardFile: (fileData, fileName, taskId) =>
      ipcRenderer.invoke('upload-clipboard-file', fileData, fileName, taskId),
    onUploadProgress: (callback) =>
      ipcRenderer.on('upload-progress', (_event, taskId, progress) => {
        callback(taskId, progress);
      }),
    fetchDiskInfo: () => ipcRenderer.invoke('fetch-disk-info'),
    getCurrentBrowserPath: () => ipcRenderer.invoke('get-current-browser-path'),
    getPreviewImg: (fileName: string) => ipcRenderer.invoke('get-preview-img', fileName),
    deleteItems: (paths: string[]) => ipcRenderer.invoke('delete-items', paths),
    onRefreshFileList: (callback) => ipcRenderer.on('refresh-file-list', (_event) => {
      callback();
    }),
    // sendMessage: (message: string) => ipcRenderer.send('message', message),
  // onUpdateNetDevices: (callback) => ipcRenderer.on('update-devices', (_event, value) => callback(value)),
  // onUpdateNetcardIpsSub: (callback) => ipcRenderer.on('update-netcard-ips-sub', (_event, value) => callback(value)),
  // onUpdateNetcardIps: (callback) => ipcRenderer.on('update-netcard-ips', (_event, value) => callback(value)),
  // onUpdateCounter: (callback) => ipcRenderer.on('update-counter', (_event, value) => callback(value)),
  // openNewWindowWithOptions: (url: string, options: any) => ipcRenderer.send('open-new-window-with-options', url, options),
  // startForwarding: (proxy_url) => ipcRenderer.send('start-forwarding', proxy_url),
  // stopForwarding: () => ipcRenderer.send('stop-forwarding'),

})

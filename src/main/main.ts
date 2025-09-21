import {app, BrowserWindow, ipcMain, dialog,  session} from 'electron';
import path, {join} from 'path';
import { verifyTOTP } from './auth';
import { randomUUID } from 'crypto';
import configManager from './config';
import { fetchItems,createFolder } from './filemanager';
import { ControlClient,MultiPortUploader } from './upload';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import os from 'os';
import tmp from 'tmp';

const config_manager = configManager;
const SERVER_IP = "110.42.45.189";
const SERVER_PORT = 16000;

const SERVER_URL = `http://${SERVER_IP}:${SERVER_PORT}`; // 替换为你的服务器地址

const control_client = new ControlClient(SERVER_IP, SERVER_PORT);
const multi_port_uploader = new MultiPortUploader(SERVER_IP, [5001, 5002, 5003, 5004, 5005]);

let current_browser_path = "";
let authUUID = config_manager.get('authUUID');
const islogin = !!authUUID;
// config_manager.set('appVersion', app.getVersion());
// console.log('App Version:', config_manager.get('appVersion'));
const windowMap = new Map<string, BrowserWindow>();

function createWindow () {
  let iconPath: string;
  if (process.env.NODE_ENV === 'development') {
  switch (process.platform) {
    case 'win32':
      iconPath = join(__dirname,'static', 'airportFunction05.ico');
      break;
    case 'darwin':
      iconPath = join(__dirname,'static', 'airportFunction05.icns');
      break;
    default: // Linux 等
      iconPath = join(__dirname,'static', 'airportFunction05.png');
      break;
  }
  }
  else {
    switch (process.platform) {
      case 'win32':
        iconPath = join(process.resourcesPath,'static', 'airportFunction05.ico');
        break;
      case 'darwin':
        iconPath = join(process.resourcesPath,'static', 'airportFunction05.icns');
        break;
      default: // Linux 等
        iconPath = join(process.resourcesPath,'static', 'airportFunction05.png');
        break;
    }
  }
  console.log("iconPath", iconPath);

  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    icon: iconPath,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      
    }
  });


  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
    const rendererPort = process.argv[2];
    mainWindow.loadURL(`http://localhost:${rendererPort}`);
  }
  else {
    mainWindow.loadFile(join(app.getAppPath(), 'renderer', 'index.html'));
  }

  mainWindow.webContents.on('cursor-changed', (event, type) => {
  // console.log('Cursor changed:', type);
  // if (['drag-drop-copy', 'drag-drop-move', 'drag-drop-link', 'alias'].includes(type)) {
  //   console.log('鼠标拖入文件或拖放操作中');
  //   // 可以做高亮提示或者准备上传逻辑
  // }
});

  mainWindow.on('closed', () => {
    // 关闭所有子窗口
    for (const win of windowMap.values()) {
      if (!win.isDestroyed()) {
        win.close();
      }
    }

    windowMap.clear();
  });
  // IPC: 前端请求选择文件
  ipcMain.handle('select-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
    });

    if (result.canceled) return [];

    return result.filePaths; // 返回真实路径数组
  });

}

app.whenReady().then(() => {
  createWindow();
  // session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  //   callback({
  //     responseHeaders: {
  //       ...details.responseHeaders,
  //       'Content-Security-Policy': ['script-src \'self\'']
  //     }
  //   })
  // })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
  
});

ipcMain.on('ondragstart', (event, filePath) => {
  console.log('ondragstart', filePath);
  // event.sender.startDrag({
  //   file: path.join(__dirname, filePath),
  //   icon: iconName
  // })
});

ipcMain.handle('check-is-login', async () => {
    return islogin;
});

ipcMain.handle('request-auth', async (_event, code) => {
    console.log('Received auth code:', code);
    // const uuid = randomUUID();
    const uuid = uuidv4();

    console.log('Generated UUID:', uuid);
    // event.reply('auth-uuid', uuid);
    const isValid = await verifyTOTP({server_url:SERVER_URL, uuid, token: code });
    if (isValid) {
        console.log('TOTP verification successful');
        // save uuid to config.json
        config_manager.set('authUUID', uuid);
        authUUID = uuid;
        
        return { success: true };
    } else {
        console.log('TOTP verification failed');
        return { success: false, message: 'Invalid TOTP code' };
    }
});

ipcMain.handle('fetch-items', async (_event, path) => {
    current_browser_path = path;
    console.log('fetch-items', path, authUUID);
    return fetchItems(path, authUUID || '');
});

ipcMain.handle('create-folder', async (_event, path, name) => {
    console.log('create-folder', path, name);
    return createFolder(path, name, authUUID || '');
});

// ipcMain.handle('upload-file', async (_event, filename) => {
//   const filePath = path.join(current_browser_path, filename);
//     console.log('upload-file', filePath);
//     if (!authUUID) {
//         return { success: false, message: 'Not authenticated' };
//     }
//     return { success: true };
// });


// IPC: 上传文件
ipcMain.handle('upload-file', async (event, filePath: string) => {
  // 这里是 绝对路径
  const remote_dest = current_browser_path + '/' + path.basename(filePath);
  console.log('Uploading file:', filePath, 'to', remote_dest);
  try {
    
    const stats = fs.statSync(filePath);
    const uploadId = await control_client.startUpload(filePath, stats.size, remote_dest, authUUID);
    const { emitter } =  await multi_port_uploader.sendFile(filePath, uploadId);
    emitter.on('progress', (progress) => {
      // event.sender.send('upload-progress', progress);
      console.log('Upload progress:', progress);
    });
    emitter.on('done', () => {
      console.log('Upload done:', remote_dest);
      // event.sender.send('upload-done', { success: true, remote_dest });
      return { success: true, uploadId, savedTo: filePath, remote_dest };
    });
    
  } catch (err) {
    console.error('Failed to upload clipboard file:', err);
    return { success: false, message: err instanceof Error ? err.message : String(err) };
  }
});



ipcMain.handle('upload-clipboard-file', async (event, fileData: ArrayBuffer, fileName: string) => {
  if (fileName === "image.png") {
    fileName = `screenshot-${Date.now()}.png`;
  }
  const dest = path.join(app.getPath('userData'), fileName);
  const remote_dest = current_browser_path + '/' + fileName;
  try {
    const tmpFile = tmp.fileSync({ postfix: '.tmp' });
    fs.writeFileSync(tmpFile.name, Buffer.from(fileData));
    const stats = fs.statSync(tmpFile.name);
    const uploadId = await control_client.startUpload(tmpFile.name, stats.size, remote_dest, authUUID);
    const { emitter } =  await multi_port_uploader.sendFile(tmpFile.name, uploadId);
    emitter.on('progress', (progress) => {
      // event.sender.send('upload-progress', progress);
      console.log('Upload progress:', progress);
    });
    emitter.on('done', () => {
      console.log('Upload done:', remote_dest);
      // event.sender.send('upload-done', { success: true, remote_dest });
      return { success: true, uploadId, savedTo: dest, remote_dest };
    });
    
  } catch (err) {
    console.error('Failed to upload clipboard file:', err);
    return { success: false, message: err instanceof Error ? err.message : String(err) };
  }
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
});


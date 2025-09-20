import {app, BrowserWindow, ipcMain, session} from 'electron';
import {join} from 'path';
import { verifyTOTP } from './auth';
import { randomUUID } from 'crypto';
import configManager from './config';
import { fetchItems } from './filecheck';
const config_manager = configManager;
const authUUID = config_manager.get('authUUID');
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

  mainWindow.on('closed', () => {
    // 关闭所有子窗口
    for (const win of windowMap.values()) {
      if (!win.isDestroyed()) {
        win.close();
      }
    }

    windowMap.clear();
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

ipcMain.handle('check-is-login', async () => {
    return islogin;
});

ipcMain.handle('request-auth', async (_event, code) => {
    console.log('Received auth code:', code);
    const uuid = randomUUID();
    console.log('Generated UUID:', uuid);
    // event.reply('auth-uuid', uuid);
    const isValid = await verifyTOTP({ uuid, token: code });
    if (isValid) {
        console.log('TOTP verification successful');
        // save uuid to config.json
        config_manager.set('authUUID', uuid);
        
        return { success: true };
    } else {
        console.log('TOTP verification failed');
        return { success: false, message: 'Invalid TOTP code' };
    }
});

ipcMain.handle('fetch-items', async (_event, path) => {
    return fetchItems(path);
});

// app.on('window-all-closed', function () {
//   if (process.platform !== 'darwin') app.quit()
// });

// // 监听渲染进程的请求
// ipcMain.on('open-new-window-with-options', (event, options) => {
//   console.log(openwindowList);
  
//   if (!openwindowList.includes(options.window_id)) {
//     openwindowList.push(options.window_id);
//     const newWindow = new BrowserWindow(options);
//     if (options.loadFile) {
//       newWindow.loadFile(options.loadFile).then(() => {
//         newWindow.setTitle('My Electron App'); // 在网页加载完成后设置标题
//     });
//     } else if (options.loadURL) {
//         newWindow.loadURL(options.loadURL).then(() => {
//           if (options.title)
//             {
//                 newWindow.setTitle(options.title); // 在网页加载完成后设置标题
//             }
//       });
//     }
//     newWindow.webContents.setZoomFactor(1.5);

//     // 解决无法关闭问题
//     newWindow.webContents.on('will-prevent-unload', (event) => {
//       console.log('页面试图阻止关闭，强制允许');
//       event.preventDefault();
//     });
//     newWindow.on('closed', () => {
//       console.log('New window closed');
//       // 通过IPC通知渲染进程窗口关闭
//       // newWindow.webContents.send('window-closed'); // 向渲染进程发送窗口关闭的事件
//       openwindowList = openwindowList.filter((value) => value !== options.window_id);
//       windowMap.delete(options.window_id);

//   });
//     windowMap.set(options.window_id, newWindow);
//     console.log("new window created");
//   }
//   else {
//     console.log("window already opened");
//     // 如果窗口已经打开，则置顶
//     const existingWindow = windowMap.get(options.window_id);
//     if (existingWindow && !existingWindow.isDestroyed()) {
//       existingWindow.focus();
//       existingWindow.show();
//     }
//   }

// });

// import EasyForward  from './easy_forward';
// const PROXY_PORT = 16789;
// // const PROXY_ADDR  = "192.168.55.100"
// // 创建 EasyForward 实例
// const easyForward = new EasyForward();
// // 启动 EasyForward 服务器
// ipcMain.on('start-forwarding', (event, value) => {
//   console.log('Received start-forwarding event with value:', value);
//   // 在这里处理前端发送的值
//   // 例如，启动 EasyForward 的转发功能

//   easyForward.start(PROXY_PORT,value);
//   event.reply('forwarding-started', 'Forwarding started successfully');
// }
// );
// ipcMain.on('stop-forwarding', (event, value) => {
//   console.log('Received stop-forwarding event with value:', value);
//   // 在这里处理前端发送的值
//   // 例如，停止 EasyForward 的转发功能
//   easyForward.stop();
//   event.reply('forwarding-stopped', 'Forwarding stopped successfully');
// }
// );
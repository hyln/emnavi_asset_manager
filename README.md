<div align="center"> 

# emNavi Discover E
</div>


## feature

- 自动识别otg接口
- 周期轮询局域网中的飞行器 (4s)

## 更新日志

### 0.2.3

- 增加了对 nvidia 设备 otg端口的自动识别
- 优化了代码结构
- 增加了代理转发功能(未启用)
- 更换了flask服务的端口
- 更换了组播地址，兼容性更好


## 在机载PC上安装emnaviboard (出厂已安装)
```bash
sudo dpkg -r emnaviboard  # 如果曾经安装过
sudo dpkg -i emNaviBoard-0.1.1.deb 
```


##  关于 框架选择
使用electron 重构的版本，tauri的版本存在两个问题
1. 向下兼容不太好
2. 学习成本较高


## Getting started

```bash
git clone git@github.com:hyaline-wang/emnaviDiscoverElectron.git
```

### Install dependencies ⏬

```bash
npm install -g cnpm --registry=https://registry.npmmirror.com
cnpm install
```

### Start developing ⚒️

```bash
npm run dev
```

## Additional Commands

```bash
npm run dev # starts application with hot reload


npm run build # builds application, distributable files can be found in "dist" folder

# OR

npm run build:win # uses windows as build target
npm run build:mac # uses mac as build target
npm run build:linux # uses linux as build target
```

Optional configuration options can be found in the [Electron Builder CLI docs](https://www.electron.build/cli.html).
## Project Structure

```bash
- scripts/ # all the scripts used to build or serve your application, change as you like.
- src/
  - main/ # Main thread (Electron application source)
  - renderer/ # Renderer thread (VueJS application source)
```

## Using static files

If you have any files that you want to copy over to the app directory after installation, you will need to add those files in your `src/main/static` directory.

Files in said directory are only accessible to the `main` process, similar to `src/renderer/assets` only being accessible to the `renderer` process. Besides that, the concept is the same as to what you're used to in your other front-end projects.

#### Referencing static files from your main process

```ts
/* Assumes src/main/static/myFile.txt exists */

import {app} from 'electron';
import {join} from 'path';
import {readFileSync} from 'fs';

const path = join(app.getAppPath(), 'static', 'myFile.txt');
const buffer = readFileSync(path);
```

<div align="center"> 

![alt text](http://file.emnavi.tech/MEDIA_ASSETS/Asset_Manager/home_page.png)

# emNavi Asset Manager
</div>
## [点击下载](http://file.emnavi.tech/emnavi_tools/asset_manager/)

## 构建emNavi Asset Manager的原因

用于代替掉之前的 emAlioss. 原因是

1. 当前基于python的框架构建的程序很难称得上是桌面端程序
1. emAlioss虽然花了比较久的时间构建，但是从安装到使用总是有一些bug
1. 定义emAlioss时有误，将图片资源，视频资源，软件资源，隔离开， 这增加了复杂度但是并没有降低使用难度，最终效果不适合小团队使用
1. oss服务对于大文件价格实在是太贵了，大文件需要存储到另外的地方，使得管理更加困难

## feature

### 速度

运营商对上传进行了qos限速，以下是简单的测试

![speed_test](http://file.emnavi.tech/MEDIA_ASSETS/Asset_Manager/speed_test.png)

| 测试方式 | 最高速度 |  |
| --- | --- | --- |
| filebrowser | 平均约2.5MB,最后200M为1 | 峰值将近5MB, 最低约1MB，平均约3MB，在1GB数据传完后平均速度低于1MB。|
| ssh/scp vscode  | 低于 2MB/s | 前期速度 约为1.5MB/s，会有一段时间降到1MB/s,,最低700KB/s，再一段时间恢复平均1.5MB/s如此循环2次。第三层被限速最后平均速度为500KB/s 最低200KB/s |
| TCP 3端口(5001,5002,5003) | 平均4MB/s | 偶尔低于4MB |
| TCP 5端口(5001~5005)，不断连 | 最低3.7，平均6.5MB，峰值10 | 5002端口在最终阶段被限流，平均速度是800KB |
| TCP 5端口(5001~5005)，4MB 小包空闲传输 | 不低于2.8MB,大部分在5MB 左右 | 没有拖累速度的地方 |
| 下载 使用ssh vscode  | 平均速度2MB |  |


上面的测试结果表明单端口直连会被限制到1.5MB/s左右。

在本软件测试中，最低不低于1.8MB/s 最高5.2MB/s 在测试中 1.2G 大小文件 用时300s,也就是说平均速度约为4MB，是顶着最大带宽运行的，从带宽变化图可以知道传输过程依然有被限速，但是已经比较满意了。


### 认证

认证使用TOTP，为了简化流程仅在第一次使用时验证


## 上传

粘贴板上传允许修改名字

## TODO


1. TCP端口到底稳不稳定依然需要时间检验


## 更新日志

### 0.0.2

- 增加粘贴板文件可重命名功能


## 快速开始

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

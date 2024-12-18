## obs-show
基于OpenLayers的通用二维态势渲染工具，使用electron封装为桌面应用，使之能够以server方式工作，支持udp通信。

![截图](public/screenshot.png)

### 使用方式
#### 安装包
1. 从[releases](https://gitlab.inspir.work/tactics/tactics-tools/obs-show/-/releases)下载最新的安装包安装运行
2. 若需替换或添加实体图标，将png格式图标放到到安装目录下的resources/icons目录内
3. udp通信41234端口
#### 源码
1. 安装nodejs
2. 安装yarn
    ```shell
    npm install -g yarn
    ```
3. 安装依赖
    ```shell
    yarn install
    ```
4. 运行
    ```shell
    yarn start
    ```
5. 若需替换或添加实体图标，将png格式图标放到到代码目录下的public/icons目录内
6. udp通信41234端口

### 数据格式
1. 通信单包格式
    ```typescript
    interface Packet {
        units: Array<Unit>, // 实体数组，每帧更新
        texts: Array<Text>, // 文本数组，每帧更新
        reset: Reset, // 重置（初始化）
        message: string, // 消息，持续展示于事件面板，默认折叠
        route: Route, // 路径，持续展示
        rectangle: Rectangle, // 矩形，持续展示
    }
    ```
2. 具体类型定义
 
    见代码目录下的[src/types/packet.d.ts](src/types/packet.d.ts)

### 通信示例
```python
import json
from socket import socket, AF_INET, SOCK_DGRAM
sock = socket(AF_INET, SOCK_DGRAM)
address = 'localhost', 41234
reset = {"reset":{
            "center": [21.4, -157.85],
            "range": [80000, 80000],
            }
        }
sock.sendto(json.dumps(reset).encode(), address)
units = [{
    "name": "plane1 30km/s",
    "position": (21.4, -157.8)
    "icon": "plane",
    "uid": 111,
    "side": 'red',
    "cirsize": 1000,
    "course": 30,
},{
    "name": "plane2 32km/s",
    "position": (21.0, -157.8)
    "icon": "plane",
    "uid": 112,
    "side": 'red',
    "sector": (1000, -30, 30),
    "course": 36,
}]
texts = [{
    text: "时间：19:30:30"
    line_number: 1
}]
sock.sendto(json.dumps({"units": units, "texts": texts}).encode(), address)
msg = "19:30:30 Z-9 1向SAM 1开火"
sock.sendto(json.dumps({"message": msg}).encode(), address)
```

### 快捷键功能
- F1 开关历史轨迹显示
- F2 右小角经纬度坐标度分秒与小数点形式切换
- F3 开关显示红方实体上的圆形和扇形（点击选中实体时其圆形和扇形一直显示）
- F4 开关显示蓝方实体上的圆形和扇形
- F5 刷新（重启窗口内部页面）
- F11 开关全屏
- F12 开关浏览器开发者工具

### 注意事项
- 当前使用的地图源为在线谷歌卫星地图，需要网络畅通。
- 传输位置数据统一为小数点形式的tuple或list，先纬度后经度，北纬东经为正。
- 右下角的高度信息为地理高度，通过高程图瓦片（关闭了渲染）的像素值反算得到的，也需要联网才有数据。
- 过多的历史轨迹点在OpenLayers底层有内存泄漏问题，可能会持续增长到2-3G左右，然后会触发内存回收，程序不会出问题，就是会占内存。
- 测距工具使用中右击重置此次测距，非使用中右击清除历史测距。

### TODO
- [ ] 开发python client sdk，使用sdk调用通信。
- [ ] 支持切换至纯色背景，方便无需地图时离线环境可直接使用。
- [ ] 开发瓦片地图抓取工具，抓取指定地理位置瓦片地图并本地部署瓦片服务，支持切换地图源。

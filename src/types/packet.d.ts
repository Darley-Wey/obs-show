interface Packet {
    units: Array<Unit>, // 实体数组，每帧更新
    texts: Array<string>, // 文本数组，每帧更新
    reset: Reset, // 重置（初始化）
    message: string, // 消息，持续展示，显示于事件面板，默认折叠
    route: Route, // 路径，持续展示
    rectangle: Rectangle, // 矩形，持续展示
}

interface Route {
    path: Array<Array<number>>,  // 路径点，经纬度
    color: string, // 颜色，支持css颜色值
}

interface Unit {
    name: string, // 单位名称，渲染于图标上方，可以在此处发一些实体的其他信息
    position: Array<number>, // 经纬度
    icon: string, // 图标，对应图标资源名称
    uid: string,  // 单位唯一标识，不可重复，据此和坐标点连通轨迹
    side: string, // 阵营与图标颜色，red/blue
    circleSize: number, // 圆形半径（米）
    course: number, // 航向（正北0度，顺时针）
    sector: number[], // 扇形，[半径（米），起始角度，结束角度（正北0度，顺时针）]
}

interface Rectangle {
    ld: Array<number>, // 左下角经纬度
    ru: Array<number>, // 右上角经纬度
    color: string, // 颜色，支持css颜色值
}

interface Reset {
    center: Array<number>,  // 中心点经纬度
    range: Array<number>,  // 画面范围（米），地图会自适应默认缩放值
}

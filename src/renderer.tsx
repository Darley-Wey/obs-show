/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.ts` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import XYZ from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';
import {fromLonLat, toLonLat} from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import Text from 'ol/style/Text';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import {LineString} from "ol/geom";
import {defaults, MousePosition} from "ol/control";
import {toStringHDMS} from "ol/coordinate";

console.log('👋 This message is being logged by "renderer.ts", included via Vite');

let showTrails = true;
let useDMS = false;

const redDeadStyle = new Style({
    image: new Icon({
        src: 'src/icons/red/cross.png', // 标记的图标 URL
        width: 30, // 图标宽度
        height: 30, // 图标高度
    })
})

const blueDeadStyle = new Style({
    image: new Icon({
        src: 'src/icons/blue/cross.png', // 标记的图标 URL
        width: 30, // 图标宽度
        height: 30, // 图标高度
    })
})

const redLineStyle = new Style({
    stroke: new Stroke({
        color: '#FF0000', // 设置路线的颜色
        width: 1, // 设置路线的宽度
    }),
});

const blueLineStyle = new Style({
    stroke: new Stroke({
        color: '#00C0FF', // 设置路线的颜色
        width: 1, // 设置路线的宽度
    }),
});

function generateUnitInitStyle(unit: Unit): Style {
    return new Style({
        image: new Icon({
            src: `src/icons/${unit.side}/${unit.icon}.png`, // 标记的图标 URL
            width: 30, // 图标宽度
            height: 30, // 图标高度
            rotation: unit.course * Math.PI / 180, // 图标旋转角度
        }),
        text: new Text({
            text: unit.name, // 初始文字
            offsetY: -25, // 文字的垂直偏移，使其显示在标记上方
            fill: new Fill({
                color: '#000', // 文字颜色
            }),
            stroke: new Stroke({
                color: '#fff', // 文字描边颜色，增加对比度
                width: 2,
            }),
            font: '12px Arial, sans-serif', // 设置字体大小和样式
        }),
    });
}

// 每个对应一个实体
let uid2PointFeature: {
    [key: string]: Feature
} = {};
// 每个对应一个实体的样式
let uid2PointStyle: {
    [key: string]: Style
} = {};
// 每个对应一个实体的航迹
let uid2LineFeature: {
    [key: string]: Feature
} = {};
// 每个对应一个实体的航迹的线
let uid2LineString: {
    [key: string]: LineString
} = {};

function reset() {
    uid2PointFeature = {};
    uid2PointStyle = {};
    uid2LineFeature = {};
    uid2LineString = {};
}

// 鼠标位置控件,额外添加获取海拔数据
const mousePosition = new MousePosition({
    coordinateFormat: function (coordinate) {
        const tileLayer = map.getLayers().item(2) as TileLayer;
        const tileSource = tileLayer.getSource() as XYZ;
        const tileGrid = tileSource.getTileGrid();
        let zoom = map.getView().getZoom();
        zoom = Math.round(zoom);
        zoom = Math.min(zoom, 15);
        const tileCoord = tileGrid.getTileCoordForCoordAndZ(coordinate, zoom);
        const tileUrl = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${tileCoord[0]}/${tileCoord[1]}/${tileCoord[2]}.png`;
        const mousePositionElement = document.getElementsByClassName('ol-mouse-position')[0];
        fetch(tileUrl, {mode: 'cors'})
            .then((response) => response.blob())
            .then((blob) => {
                const img = new Image();
                img.src = URL.createObjectURL(blob);
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d')!;
                    canvas.width = img.width;
                    canvas.height = img.height;
                    context.drawImage(img, 0, 0);
                    // 获取鼠标相对于瓦片的像素坐标
                    const tileExtent = tileGrid.getTileCoordExtent(tileCoord);
                    const resolution = tileGrid.getResolution(zoom);
                    const xRelative = (coordinate[0] - tileExtent[0]) / resolution;
                    const yRelative = (tileExtent[3] - coordinate[1]) / resolution;
                    // 获取对应的像素
                    const pixel = context.getImageData(xRelative, yRelative, canvas.width, canvas.height).data;
                    const elevation = ((pixel[0] * 256 + pixel[1] + pixel[2] / 256) - 32768);
                    const lonLat = toLonLat(coordinate);
                    if (!useDMS) {
                        mousePositionElement.innerHTML = `${lonLat[1].toFixed(4)} N  ${lonLat[0].toFixed(4)} E  ${elevation.toFixed()} 米`;
                    } else {
                        const StringHDMS = toStringHDMS(lonLat);
                        mousePositionElement.innerHTML = `${StringHDMS}  ${elevation.toFixed()} 米`;
                    }
                };
            });
        return mousePositionElement.innerHTML;
    },
    projection: 'EPSG:3857',
})

const vectorSource = new VectorSource()
const map = new Map({
    target: 'map', // html上地图容器的 ID
    layers: [
        new TileLayer({
            source: new XYZ({
                url: 'https://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}',
                maxZoom: 22,
            }),
        }),
        new VectorLayer({
            source: vectorSource,
        }),
        new TileLayer({
            source: new XYZ({
                url: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
                maxZoom: 15 // 最大缩放等级
            }),
            visible: false // 不显示瓦片，只用于海拔数据获取
        })
    ],
    view: new View({
        center: fromLonLat([-157.85, 21.4]),
        zoom: 10,
    }),
    controls: defaults().extend([
        mousePosition
    ]),
});

window.electronAPI.onReceiveMessage((value: Packet) => {
    // console.log(value);
    if (value.reset) {
        vectorSource.clear();
        reset();
        return;
    }

    if (value.texts) {
        let message = '';
        for (const text of value.texts) {
            message += text.text + '\n';
        }
        const textElement = document.getElementById('text-message')
        textElement.innerText = message;
    }
    // 移除已经不存在的单位
    for (const uid in uid2PointFeature) {
        if (!value.units.find(unit => unit.uid === uid)) {
            vectorSource.removeFeature(uid2PointFeature[uid]);
            vectorSource.removeFeature(uid2LineFeature[uid]);
        }
    }

    for (const unit of value.units) {
        // 更新单位的态势
        if (uid2PointFeature[unit.uid]) {
            uid2PointFeature[unit.uid].setGeometry(new Point(fromLonLat([unit.position[1], unit.position[0]])));
            uid2PointStyle[unit.uid].getText().setText(unit.icon === 'cross' ? '' : unit.name);
            uid2PointStyle[unit.uid].getImage().setRotation(unit.course * Math.PI / 180);
            uid2LineString[unit.uid].appendCoordinate(fromLonLat([unit.position[1], unit.position[0]]));
            uid2LineFeature[unit.uid].setGeometry(uid2LineString[unit.uid]);
            // 叠加死亡样式
            if (unit.icon == "cross") {
                uid2PointFeature[unit.uid].setStyle([
                    uid2PointStyle[unit.uid],
                    unit.side === 'red' ? redDeadStyle : blueDeadStyle
                ])
            }

        } else {
            // 初始化单位
            uid2PointFeature[unit.uid] = new Feature({
                geometry: new Point(fromLonLat([unit.position[1], unit.position[0]])), // 初始化坐标
            });
            uid2PointStyle[unit.uid] = generateUnitInitStyle(unit);
            uid2PointFeature[unit.uid].setStyle(uid2PointStyle[unit.uid]);
            vectorSource.addFeature(uid2PointFeature[unit.uid]);

            // 航迹
            uid2LineString[unit.uid] = new LineString([fromLonLat([unit.position[1], unit.position[0]])]);
            uid2LineFeature[unit.uid] = new Feature({
                geometry: uid2LineString[unit.uid],
            });
            uid2LineFeature[unit.uid].setStyle(unit.side === 'red' ? redLineStyle : blueLineStyle);
            vectorSource.addFeature(uid2LineFeature[unit.uid]);
        }
    }
})

// 监听按键,按下 F1 切换航迹显示
document.addEventListener('keydown', (event) => {
    if (event.key === 'F1') {
        showTrails = !showTrails;
        for (const feature in uid2LineFeature)
            if (showTrails) vectorSource.addFeature(uid2LineFeature[feature]);
            else vectorSource.removeFeature(uid2LineFeature[feature]);
    } else if (event.key === 'F2') {
        useDMS = !useDMS;
        const e = window.event as MouseEvent
        map.getViewport().dispatchEvent(
            new PointerEvent('pointermove', {
                clientX: e.clientX,
                clientY: e.clientY,
            }));
    }
})

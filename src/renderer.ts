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

import './renderer.css';
import './App'

import olMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import XYZ from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';
import {fromLonLat} from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Style from 'ol/style/Style';
import {LineString} from "ol/geom";
import {defaults} from "ol/control";

import {addMeasureTool} from "./tools/MeasureTool/MeasureTool";
import {blueDeadStyle, blueLineStyle, generateUnitInitStyle, redDeadStyle, redLineStyle} from "./unitStyle";
import {store} from "./config";
import {mousePosition} from "./controls/mousePositionControl";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import {RegularShape} from "ol/style";

console.log('👋 This message is being logged by "renderer.ts", included via Vite');


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

const vectorSource = new VectorSource()
const map = new olMap({
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
addMeasureTool(map);
store.map = map;

window.electronAPI.onReceiveMessage((value: Packet) => {
    // console.log(value);
    if (value.reset) {
        vectorSource.clear();
        reset();
        return;
    }

    if (value.texts) {
        // 左上角文本
        let message = '';
        for (const text of value.texts) {
            message += text.text + '\n';
        }
        const textElement = document.getElementById('text-message')
        textElement.innerText = message;
    }
    if (value.message) {
        store.messages.push(value.message);
        window.dispatchEvent(new Event('message'));
        return;
    }

    if (value.route) {
        console.log(value.route, 'route');
        const route = value.route;
        const routeFeature = new Feature({
            geometry: new LineString(route.path.map(([lat, lon]) => fromLonLat([lon, lat]))),
        });
        routeFeature.setStyle((feature) => {
            const styles = []
            styles.push(new Style({
                stroke: new Stroke({
                    color: route.color,
                    width: 2,
                })
            }))
            const geom = feature.getGeometry() as LineString;
            const coords = geom.getCoordinates();
            coords.forEach((coord, index) => {
                styles.push(new Style({
                    geometry: new Point(coord),
                    image: new RegularShape({
                        points: 3,
                        radius: 5,
                        fill: new Fill({
                            color: route.color,
                        })
                    })
                }))
            })
            return styles;
        });
        vectorSource.addFeature(routeFeature);
        return;
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
            const style = generateUnitInitStyle(unit);
            [uid2PointStyle[unit.uid]] = style;
            uid2PointFeature[unit.uid].setStyle(style);
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

// 监听按键
document.addEventListener('keydown', (event) => {
    if (event.key === 'F1') {
        // F1 切换航迹显示
        store.showTrails = !store.showTrails;
        for (const feature in uid2LineFeature)
            if (store.showTrails) vectorSource.addFeature(uid2LineFeature[feature]);
            else vectorSource.removeFeature(uid2LineFeature[feature]);
    } else if (event.key === 'F2') {
        // F2 切换坐标显示格式
        store.useDMS = !store.useDMS;
        // 获取鼠标位置，触发更新
        const e = window.event as MouseEvent
        map.getViewport().dispatchEvent(
            new PointerEvent('pointermove', {
                clientX: e.clientX,
                clientY: e.clientY,
            }));
    } else if (event.key === 'F3') {
        // F3 切换显示红方圆和扇形
        store.showRedCircleAndSector = !store.showRedCircleAndSector;
    } else if (event.key === 'F4') {
        // F4 切换显示蓝方圆和扇形
        store.showBlueCircleAndSector = !store.showBlueCircleAndSector;
    }
})

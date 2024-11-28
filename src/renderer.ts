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

import {MeasureControl} from "./controls";
import {store} from "./config";
import {mousePosition} from "./controls/mousePositionControl";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import {RegularShape} from "ol/style";
import {Select} from "ol/interaction";
import UnitFeature from "./unitStyle";

console.log('👋 This message is being logged by "renderer.ts", included via Vite');


// 每个对应一个实体
let uid2UnitFeature: {
    [key: string]: UnitFeature
} = {};

function reset() {
    uid2UnitFeature = {};
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
map.addControl(new MeasureControl());
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
    for (const uid in uid2UnitFeature) {
        if (!value.units.find(unit => unit.uid === uid)) {
            vectorSource.removeFeature(uid2UnitFeature[uid]);
            vectorSource.removeFeature(uid2UnitFeature[uid].lineFeature);
            delete uid2UnitFeature[uid];
        }
    }

    for (const unit of value.units) {
        // 更新单位的态势
        if (uid2UnitFeature[unit.uid]) {
            uid2UnitFeature[unit.uid].update(unit)
        } else {
            // 初始化单位
            uid2UnitFeature[unit.uid] = new UnitFeature(unit)
            vectorSource.addFeature(uid2UnitFeature[unit.uid]);
            vectorSource.addFeature(uid2UnitFeature[unit.uid].lineFeature);
        }
    }
})

// 监听按键
document.addEventListener('keydown', (event) => {
    if (event.key === 'F1') {
        // F1 切换航迹显示
        store.showTrails = !store.showTrails;
        for (const feature in uid2UnitFeature)
            if (store.showTrails) vectorSource.addFeature(uid2UnitFeature[feature].lineFeature);
            else vectorSource.removeFeature(uid2UnitFeature[feature].lineFeature);
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
        vectorSource.changed()
    } else if (event.key === 'F4') {
        // F4 切换显示蓝方圆和扇形
        store.showBlueCircleAndSector = !store.showBlueCircleAndSector;
        vectorSource.changed()
    }
})

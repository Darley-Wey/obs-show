import './Map.css'

import React, {useEffect, useImperativeHandle} from "react"
import olMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import XYZ from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';
import {fromLonLat, transformExtent} from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Style from 'ol/style/Style';
import {LineString} from "ol/geom";
import {fromExtent} from 'ol/geom/Polygon';
import {Zoom} from "ol/control";

import {MeasureControl} from "./controls";
import {store} from "./config";
import {MousePositionControl} from "./controls/mousePositionControl";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import {RegularShape} from "ol/style";
import {Select} from "ol/interaction";
import UnitFeature from "./unitStyle";

interface MapProps {
    style?: React.CSSProperties,
    packet?: Packet,
}

const defaultStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'relative',
}

// 每个对应一个实体
let uid2UnitFeature: {
    [key: string]: UnitFeature
} = {};

function reset() {
    vectorSource.clear();
    uid2UnitFeature = {};
    store.messages = [];
    window.dispatchEvent(new Event('message'));
    const textElement = document.getElementById('text-message')
    textElement.innerText = '';
}

const vectorSource = new VectorSource()
const vectorLayer = new VectorLayer({
    source: vectorSource,
});
let map: olMap;

export const Map = React.forwardRef((props: MapProps, ref) => {
    useEffect(() => {
        map = new olMap({
            target: 'map', // html上地图容器的 ID
            layers: [
                new TileLayer({
                    source: new XYZ({
                        url: 'https://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}',
                        maxZoom: 22,
                    }),
                }),
                vectorLayer,
            ],
            view: new View({
                center: fromLonLat([104.1954, 35.8617]),
                zoom: 4,
            }),
            controls: [
                new MousePositionControl(),
                new Zoom({
                    target: document.body,
                    zoomOutLabel: '−',
                }),
            ],
        });
        map.addControl(new MeasureControl());
        store.map = map;

        // 添加 Select 交互
        const selectInteraction = new Select({
            layers: [vectorLayer], // 仅对该图层启用交互
            style: null // 禁用默认样式
        });
        map.addInteraction(selectInteraction);
        // 监听选中事件
        selectInteraction.on('select', (event) => {
            const selectedFeatures = event.selected;
            for (const feature of selectedFeatures) {
                if (!(feature instanceof UnitFeature)) continue;
                feature.updateSelectedStyle()
            }
            for (const feature of event.deselected) {
                if (!(feature instanceof UnitFeature)) continue;
                feature.updateStyle()
            }
        });

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
    }, []);

    useImperativeHandle(ref, () => ({
        updatePacket: (packet: Packet) => {
            if (!packet) return;
            if (packet.reset) {
                reset();
                const resetParams = packet.reset;
                let center: number[]
                if (resetParams.center) {
                    center = fromLonLat([resetParams.center[1], resetParams.center[0]]);
                    map.getView().setCenter(center);
                }
                if (resetParams.range) {
                    const minX = center[0] - resetParams.range[0] / 2;
                    const minY = center[1] - resetParams.range[1] / 2;
                    const maxX = center[0] + resetParams.range[0] / 2;
                    const maxY = center[1] + resetParams.range[1] / 2;
                    map.getView().fit(fromExtent([minX, minY, maxX, maxY]));
                }
                return;
            }

            if (packet.texts) {
                // 左上角文本
                let message = '';
                for (const text of packet.texts) {
                    message += text + '\n';
                }
                const textElement = document.getElementById('text-message')
                textElement.innerText = message !== '' ? message : textElement.innerText;
                return;
            }
            if (packet.message) {
                store.messages.push(packet.message);
                window.dispatchEvent(new Event('message'));
                return;
            }

            if (packet.route) {
                console.log(packet.route, 'route');
                const route = packet.route;
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
                    coords.forEach((coord) => {
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

            if (packet.rectangle) {
                const rectangle = packet.rectangle;
                const rectangleFeature = new Feature({
                    geometry: fromExtent(transformExtent([
                        rectangle.ld[1], rectangle.ld[0], rectangle.ru[1], rectangle.ru[0]
                    ], 'EPSG:4326', 'EPSG:3857')),
                });
                rectangleFeature.setStyle(new Style({
                    stroke: new Stroke({
                        color: rectangle.color || 'red',
                        width: 2,
                    })
                }));
                vectorSource.addFeature(rectangleFeature);
                return;
            }

            // 移除已经不存在的单位
            for (const uid in uid2UnitFeature) {
                if (!packet.units.find(unit => unit.uid === uid)) {
                    vectorSource.removeFeature(uid2UnitFeature[uid]);
                    vectorSource.removeFeature(uid2UnitFeature[uid].lineFeature);
                    delete uid2UnitFeature[uid];
                }
            }

            for (const unit of packet.units) {
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
        }
    }));

    return (
        <div id="map" style={{...defaultStyle, ...props.style}}>
            <div id="text-message"></div>
        </div>
    )
})

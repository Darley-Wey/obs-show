import './MeasureTool.css';

import Map from 'ol/Map';
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import {Draw} from "ol/interaction";
import {primaryAction} from "ol/events/condition";
import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import {Overlay} from "ol";
import {LineString} from "ol/geom";
import {getLength} from "ol/sphere";

import {formatLength} from "../../util";


const drawVector = new VectorSource()
const draw = new Draw({
    source: drawVector,
    type: 'LineString',
    condition: primaryAction, // 只有鼠标左键点击时触发
    style: new Style({
        stroke: new Stroke({
            color: '#ffcc33',
            lineDash: [10, 10],
            width: 2,
        }),
    })
})
const measureTooltipClass = {
    tooltip: 'measure-tooltip',
    tooltipStatic: 'measure-tooltip-static',
    tooltipDynamic: 'measure-tooltip-dynamic',
}
const measureTooltip = new Overlay({
    element: document.createElement('div'),
    offset: [0, -15],
    positioning: 'bottom-center',
    className: '',
})

export function addMeasureTool(map: Map) {
    map.addLayer(new VectorLayer({
        source: drawVector,
    }))
    map.addInteraction(draw);

    draw.on('drawstart', (event) => {
        // 移除之前的绘制
        drawVector.clear();
        map.removeOverlay(measureTooltip);
        let tooltipAdded = false
        // 监听绘制过程
        const geom = event.feature.getGeometry() as LineString;
        geom.on('change', () => {
            if (!tooltipAdded) {
                tooltipAdded = true;
                map.addOverlay(measureTooltip);
            }
            const el = measureTooltip.getElement();
            el.innerHTML = formatLength(getLength(geom), 2);
            el.className = `${measureTooltipClass.tooltip} ${measureTooltipClass.tooltipDynamic}`;
            measureTooltip.setPosition(geom.getLastCoordinate());
        })
    })

    draw.on('drawend', (event) => {
        const geom = event.feature.getGeometry() as LineString;
        const el = measureTooltip.getElement();
        el.innerHTML = formatLength(getLength(geom), 2);
        el.className = `${measureTooltipClass.tooltip} ${measureTooltipClass.tooltipStatic}`;
        measureTooltip.setPosition(geom.getLastCoordinate());
    })

    // 右键取消绘制
    map.getViewport().addEventListener('contextmenu', () => {
        draw.abortDrawing();
        drawVector.clear();
        map.removeOverlay(measureTooltip);
    })
}

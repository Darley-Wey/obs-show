import './MeasureControl.css';

import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import {Draw} from "ol/interaction";
import {primaryAction} from "ol/events/condition";
import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import {Overlay} from "ol";
import {LineString} from "ol/geom";
import {getLength} from "ol/sphere";
import {Control} from "ol/control";

import {formatLength} from "../../util";


const measureTooltipClass = {
    tooltip: 'measure-tooltip',
    tooltipStatic: 'measure-tooltip-static',
    tooltipDynamic: 'measure-tooltip-dynamic',
}

const newMeasureTooltip = () => new Overlay({
    element: document.createElement('div'),
    offset: [0, -15],
    positioning: 'bottom-center',
    className: '',
})

export class MeasureControl extends Control {
    private layer: VectorLayer;
    private tooltips: Overlay[];
    private drawing: boolean;
    private readonly source: VectorSource;

    constructor() {
        const button = document.createElement('button');
        button.tabIndex = -1;
        button.innerHTML = '<i class="iconfont icon-ruler measure-icon"></i>';
        button.className = 'measure-button';
        button.title = '测距';
        button.addEventListener('click', () => {
            this.init();
            this.addMeasureTool();
        })
        super({
            element: button,
            target: document.body,
        });
        this.layer = null;
        this.tooltips = [];
        this.drawing = false;
        this.source = new VectorSource();
    }

    private generateDraw = () => {
        return new Draw({
            source: this.source,
            type: 'LineString',
            condition: primaryAction, // 只有鼠标左键点击时触发
            style: new Style({
                stroke: new Stroke({
                    color: '#ffcc33',
                    lineDash: [10, 10],
                    width: 2,
                }),
            })
        });
    }

    private init() {
        if (this.layer) return
        this.layer = new VectorLayer({
            source: this.source,
        })
        this.getMap().addLayer(this.layer);
        // 非绘制过程右键清空绘制
        this.getMap().getViewport().addEventListener('contextmenu', () => {
            if (!this.drawing) {
                this.source.clear();
                this.tooltips.forEach(tooltip => this.getMap().removeOverlay(tooltip));
                this.getMap().getInteractions().forEach(interaction => {
                    if (interaction instanceof Draw) {
                        this.getMap().removeInteraction(interaction);
                    }
                })
            }
        })

    }

    private addMeasureTool() {
        this.drawing = true;
        const draw = this.generateDraw()
        this.getMap().addInteraction(draw);
        const measureTooltip = newMeasureTooltip();
        this.tooltips.push(measureTooltip);

        const abortDrawing = () => {
            draw.abortDrawing();
            this.drawing = false;
            this.getMap().removeOverlay(measureTooltip);
        }

        draw.on('drawstart', (event) => {
            this.drawing = true;
            this.getMap().addOverlay(measureTooltip);
            // 监听绘制过程
            const geom = event.feature.getGeometry() as LineString;
            const el = measureTooltip.getElement();
            el.innerHTML = '';
            el.className = '';
            measureTooltip.setPosition(geom.getLastCoordinate());
            geom.on('change', () => {
                el.innerHTML = formatLength(getLength(geom), 2);
                el.className = `${measureTooltipClass.tooltip} ${measureTooltipClass.tooltipDynamic}`;
                measureTooltip.setPosition(geom.getLastCoordinate());
            })
            // 右键取消绘制
            this.getMap().getViewport().addEventListener('contextmenu', abortDrawing)
        })

        draw.on('drawend', (event) => {
            const geom = event.feature.getGeometry() as LineString;
            const el = measureTooltip.getElement();
            el.innerHTML = formatLength(getLength(geom), 2);
            el.className = `${measureTooltipClass.tooltip} ${measureTooltipClass.tooltipStatic}`;
            measureTooltip.setPosition(geom.getLastCoordinate());
            this.getMap().removeInteraction(draw);
            this.drawing = false;
            // 取消右键监听
            this.getMap().getViewport().removeEventListener('contextmenu', abortDrawing)
        })
    }

}

export default MeasureControl;

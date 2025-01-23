import Style from "ol/style/Style";
import Icon from "ol/style/Icon";
import Text from "ol/style/Text";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import {Coordinate} from "ol/coordinate";
import Feature from "ol/Feature";
import {fromLonLat} from "ol/proj";
import Point from "ol/geom/Point";
import {LineString} from "ol/geom";

import {metersToPixels} from "./util";
import {blue, red, transparentBlue, transparentRed, store} from "./config";

const resourcesPath = window.electronAPI?.getResourcesPath();
console.log('resourcesPath', resourcesPath)

const redDeadStyle = new Style({
    image: new Icon({
        src: `${resourcesPath}/icons/red/cross.png`, // 标记的图标 URL
        width: 30, // 图标宽度
        height: 30, // 图标高度
    })
})

const blueDeadStyle = new Style({
    image: new Icon({
        src: `${resourcesPath}/icons/blue/cross.png`, // 标记的图标 URL
        width: 30, // 图标宽度
        height: 30, // 图标高度
    })
})

const redLineStyle = new Style({
    stroke: new Stroke({
        color: red, // 设置路线的颜色
        width: 1, // 设置路线的宽度
    }),
});

const blueLineStyle = new Style({
    stroke: new Stroke({
        color: blue, // 设置路线的颜色
        width: 1, // 设置路线的宽度
    }),
});

const redTargetLineStyle = new Style({
    stroke: new Stroke({
        color: red, // 设置路线的颜色
        width: 2, // 设置路线的宽度
    }),
});

const blueTargetLineStyle = new Style({
    stroke: new Stroke({
        color: blue, // 设置路线的颜色
        width: 2, // 设置路线的宽度
    }),
});

class UnitFeature extends Feature {
    private unit: Unit;
    private coordinate: Coordinate;
    private side: string;
    private icon: string;
    private course: number;
    private name: string;
    private circleSize: number;
    private sector: number[];
    private baseStyle: Style;
    private lineString: LineString;
    public lineFeature: Feature;
    private targetLineString: LineString;
    public targetLineFeature: Feature;

    constructor(unit: Unit) {
        super({
            geometry: new Point(fromLonLat([unit.position[1], unit.position[0]])),
        });
        this.updateUnit(unit)
        this.updateStyle();
        this.initLine();
    }

    private initLine() {
        this.lineString = new LineString([this.coordinate]);
        this.lineFeature = new Feature({
            geometry: this.lineString,
        });
        this.lineFeature.setStyle(this.side === 'red' ? redLineStyle : blueLineStyle);

        this.targetLineString = new LineString([this.coordinate]);
        this.targetLineFeature = new Feature({
            geometry: this.targetLineString,
        });
        this.targetLineFeature.setStyle(this.side === 'red' ? redTargetLineStyle : blueTargetLineStyle);
        if (this.unit.targetLine) {
            this.updateTargetLine();
        }
    }

    private updateUnit(unit: Unit) {
        this.unit = unit;
        this.coordinate = fromLonLat([unit.position[1], unit.position[0]]);
        this.side = unit.side;
        this.icon = unit.icon;
        this.course = unit.course;
        this.name = unit.name;
        this.circleSize = unit.circleSize
        this.sector = unit.sector;
    }

    public update(unit: Unit) {
        this.updateUnit(unit)
        this.setGeometry(new Point(fromLonLat([unit.position[1], unit.position[0]])))
        this.baseStyle.getText().setText(unit.icon === 'cross' ? '' : unit.name);
        this.baseStyle.getImage().setRotation(unit.course * Math.PI / 180);
        if (unit.icon == "cross") {
            this.setStyle([
                this.baseStyle,
                unit.side === 'red' ? redDeadStyle : blueDeadStyle
            ])
        }
        this.updateLine();
        this.updateTargetLine();
    }

    public updateLine() {
        const lastCoordinate = this.lineString.getLastCoordinate()
        if (lastCoordinate[0] === this.coordinate[0] && lastCoordinate[1] === this.coordinate[1]) return;
        this.lineString.appendCoordinate(this.coordinate);
    }

    public updateTargetLine() {
        if (!this.unit.targetLine) {
            this.targetLineString.setCoordinates([this.coordinate]);
            return
        }
        const targetCoordinate = fromLonLat([this.unit.targetLine[1], this.unit.targetLine[0]]);
        this.targetLineString.setCoordinates([this.coordinate, targetCoordinate]);
    }

    public updateStyle() {
        this.baseStyle = this.generateBaseStyle();
        const circleStyle = this.generateCircleStyle(false);
        const sectorStyle = this.generateSectorStyle(false);
        this.setStyle([this.baseStyle, circleStyle, sectorStyle]);
    }

    public updateSelectedStyle() {
        const circleStyle = this.generateCircleStyle(true);
        const sectorStyle = this.generateSectorStyle(true);
        this.setStyle([this.baseStyle, circleStyle, sectorStyle]);
    }

    private generateCircleStyle(selected: boolean): Style {
        return new Style({
            renderer: (pixel: Coordinate, state) => {
                if (!this.circleSize) return;
                if (this.side == 'red' && !store.showRedCircleAndSector && !selected) return;
                if (this.side == 'blue' && !store.showBlueCircleAndSector && !selected) return
                const context = state.context;
                const x = pixel[0];
                const y = pixel[1];
                const radius = metersToPixels(this.circleSize);
                context.beginPath();
                context.arc(x, y, radius, 0, 2 * Math.PI);
                context.closePath();
                context.strokeStyle = this.side === 'red' ? red : blue;
                context.stroke();
                if (selected) {
                    context.fillStyle = this.side === 'red' ? transparentRed : transparentBlue;
                    context.fill();
                }
            }
        })
    }

    private generateSectorStyle(selected: boolean): Style {
        return new Style({
            renderer: (pixel: Coordinate, state) => {
                if (!this.sector) return;
                if (this.side == 'red' && !store.showRedCircleAndSector && !selected) return;
                if (this.side == 'blue' && !store.showBlueCircleAndSector && !selected) return
                const context = state.context;
                const x = pixel[0];
                const y = pixel[1];
                let [radius, startAngle, endAngle] = this.sector;
                radius = metersToPixels(radius);
                startAngle = startAngle % 360 * Math.PI / 180;
                endAngle = endAngle % 360 * Math.PI / 180;
                context.beginPath();
                context.moveTo(x, y);
                context.arc(x, y, radius, startAngle - Math.PI / 2, endAngle - Math.PI / 2);
                context.closePath();
                context.strokeStyle = this.side === 'red' ? red : blue;
                context.stroke();
                if (selected) {
                    context.fillStyle = this.side === 'red' ? transparentRed : transparentBlue;
                    context.fill();
                }
            }
        })
    }

    public generateBaseStyle(): Style {
        return new Style({
            image: new Icon({
                src: `${resourcesPath}/icons/${this.side}/${this.icon}.png`, // 标记的图标 URL
                width: 30, // 图标宽度
                height: 30, // 图标高度
                rotation: this.course * Math.PI / 180, // 图标旋转角度
            }),
            text: new Text({
                text: this.name, // 初始文字
                offsetY: -25, // 文字的垂直偏移，使其显示在标记上方
                fill: new Fill({
                    color: '#07f809', // 文字颜色
                }),
                // stroke: new Stroke({
                //     color: '#fff', // 文字描边颜色，增加对比度
                //     width: 1,
                // }),
                font: '12px Arial, sans-serif', // 设置字体大小和样式
            }),
        })
    }
}

export default UnitFeature;

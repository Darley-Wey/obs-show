import Style from "ol/style/Style";
import Icon from "ol/style/Icon";
import Text from "ol/style/Text";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import {Coordinate} from "ol/coordinate";

import {metersToPixels} from "./util";
import {blue, red, transparentBlue, transparentRed, store} from "./config";

export const redDeadStyle = new Style({
    image: new Icon({
        src: 'src/icons/red/cross.png', // 标记的图标 URL
        width: 30, // 图标宽度
        height: 30, // 图标高度
    })
})

export const blueDeadStyle = new Style({
    image: new Icon({
        src: 'src/icons/blue/cross.png', // 标记的图标 URL
        width: 30, // 图标宽度
        height: 30, // 图标高度
    })
})

export const redLineStyle = new Style({
    stroke: new Stroke({
        color: red, // 设置路线的颜色
        width: 1, // 设置路线的宽度
    }),
});

export const blueLineStyle = new Style({
    stroke: new Stroke({
        color: blue, // 设置路线的颜色
        width: 1, // 设置路线的宽度
    }),
});

export function generateUnitInitStyle(unit: Unit): Style[] {
    return [
        new Style({
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
        }),
        // 画圆
        new Style({
            renderer: (pixel: Coordinate, state) => {
                if (!unit.cirsize) return;
                if (unit.side == 'red' && !store.showRedCircleAndSector) return;
                if (unit.side == 'blue' && !store.showBlueCircleAndSector) return
                const context = state.context;
                const x = pixel[0];
                const y = pixel[1];
                const radius = metersToPixels(unit.cirsize);
                context.beginPath();
                context.arc(x, y, radius, 0, 2 * Math.PI);
                context.closePath();
                context.strokeStyle = unit.side === 'red' ? red : blue;
                context.stroke();
                // context.fillStyle = unit.side === 'red' ? transparentRed : transparentBlue;
                // context.fill();
            }
        }),
        // 画扇形
        new Style({
            renderer: (pixel: Coordinate, state) => {
                if (!unit.sector) return;
                if (unit.side == 'red' && !store.showRedCircleAndSector) return;
                if (unit.side == 'blue' && !store.showBlueCircleAndSector) return
                const context = state.context;
                const x = pixel[0];
                const y = pixel[1];
                let [radius, startAngle, endAngle] = unit.sector;
                radius = metersToPixels(radius);
                startAngle = startAngle % 360 * Math.PI / 180;
                endAngle = endAngle % 360 * Math.PI / 180;
                context.beginPath();
                context.moveTo(x, y);
                // 入参以12点钟方向为0度，顺时针为正
                context.arc(x, y, radius, startAngle - Math.PI / 2, endAngle - Math.PI / 2);
                context.closePath();
                context.strokeStyle = unit.side === 'red' ? red : blue;
                context.stroke();
                // context.fillStyle = unit.side === 'red' ? transparentRed : transparentBlue;
                // context.fill();
            }
        })
    ]
}

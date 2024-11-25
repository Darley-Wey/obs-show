// 鼠标位置控件,额外添加获取海拔数据
import {toLonLat} from "ol/proj";
import {toStringHDMS} from "ol/coordinate";
import {MousePosition} from "ol/control";
import XYZ from "ol/source/XYZ";
import TileLayer from "ol/layer/Tile";

import {store} from "../config";


export const mousePosition = new MousePosition({
    coordinateFormat: function (coordinate) {
        const map = store.map
        if (!map) return '';
        const tileLayer = map.getLayers().item(2) as TileLayer;
        const tileSource = tileLayer.getSource() as XYZ;
        const tileGrid = tileSource.getTileGrid();
        const zoom = tileGrid.getZForResolution(map.getView().getResolution());
        const tileCoord = tileGrid.getTileCoordForCoordAndZ(coordinate, zoom);
        const [z, x, y] = tileCoord;
        const tile = tileSource.getTile(z, x, y, window.devicePixelRatio, map.getView().getProjection());
        tile.load()
        const mousePositionElement = document.getElementsByClassName('ol-mouse-position')[0];
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const img = tile.getImage();
        img.onload = () => {
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
            if (!store.useDMS) {
                mousePositionElement.innerHTML = `${lonLat[1].toFixed(4)} N  ${lonLat[0].toFixed(4)} E  ${elevation.toFixed()} 米`;
            } else {
                const StringHDMS = toStringHDMS(lonLat);
                mousePositionElement.innerHTML = `${StringHDMS}  ${elevation.toFixed()} 米`;
            }
        }
        return mousePositionElement.innerHTML;
    },
    projection: 'EPSG:3857',
})

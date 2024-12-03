import {store} from "./config";
import olMap from "ol/Map";
import {getPointResolution} from "ol/proj";

export function formatLength(length: number, decimalPlaces: number,): string {
    const decimalHelper = Math.pow(10, decimalPlaces);
    let output;
    if (length > 1000) {
        output = (Math.round(length / 1000 * decimalHelper) / decimalHelper) + ' km';
    } else if (length > 1) {
        output = (Math.round(length * decimalHelper) / decimalHelper) + ' m';
    } else {
        output = (Math.round(length * 100 * decimalHelper) / decimalHelper) + ' cm';
    }
    return output;
}

export function metersToPixels(meters: number): number {
    const map: olMap = store.map;
    if (!map) {
        return 0;
    }
    const center = map.getView().getCenter();
    const resolution = map.getView().getResolution();
    const pointResolution = getPointResolution('EPSG:3857', resolution, center);
    const dpr = window.devicePixelRatio;
    if (resolution !== undefined) {
        return meters / pointResolution * dpr;
    }
    return 0;
}

import {store} from "./config";

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
    const map = store.map;
    if (!map) {
        return 0;
    }
    const resolution = map.getView().getResolution();
    if (resolution !== undefined) {
        return meters / resolution;
    }
    return 0;
}

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

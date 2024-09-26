interface Packet{
    units: Array<Unit>,
    texts: Array<string>,
}

interface Unit{
    name: string,
    position: Array<number>,
    icon: string,
    uid: string,
    side: string,
    circleSize: number,
    textSize: number,
    iconSize: number,
    simTime: number,
    course: number,
    sector: number,
}

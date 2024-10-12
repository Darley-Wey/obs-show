interface Packet{
    units: Array<Unit>,
    texts: Array<TextMessage>,
    reset: boolean,
}

interface TextMessage{
    text: string,
    line_num: number,
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

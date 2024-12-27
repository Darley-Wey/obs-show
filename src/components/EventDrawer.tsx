import React, {useEffect, useRef, useState} from "react";
import {Drawer} from "antd";
import {LeftOutlined} from "@ant-design/icons";


type Props = { data: string[] };
const buttonStyle: React.CSSProperties = {
    position: 'fixed',
    right: 0,
    top: '50%',
    background: 'white',
    zIndex: 10
}

export const EventDrawer: React.FC<Props> = ({data}) => {
    const [open, setOpen] = useState(false);
    const drawerContentRef = useRef<HTMLDivElement>(null);

    const showDrawer = () => {
        setOpen(true);
    };
    const onClose = () => {
        setOpen(false);
    };

    useEffect(() => {
        if (drawerContentRef.current) {
            drawerContentRef.current.scrollTop = drawerContentRef.current.scrollHeight;
        }
    }, [data]);

    return (
        <>
            <LeftOutlined onClick={showDrawer} style={buttonStyle}/>
            <Drawer title="事件看板" onClose={onClose} open={open} mask={false}>
                <div ref={drawerContentRef} style={{maxHeight: '100%', overflowY: 'auto'}}>
                    {data.map((item, index) => (
                        <p key={index}>{item}</p>
                    ))}
                </div>
            </Drawer>
        </>
    );
}

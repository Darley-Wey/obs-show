import './App.css'
import React, {useEffect, useRef, useState} from "react";
import {Drawer} from "antd";
import {LeftOutlined} from "@ant-design/icons";
import {createRoot} from "react-dom/client";
import {store} from "./config";

const App: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [data, setData] = useState([]);
    const drawerContentRef = useRef<HTMLDivElement>(null);

    const showDrawer = () => {
        setOpen(true);
    };
    const onClose = () => {
        setOpen(false);
    };
    useEffect(() => {
        const handleData =  () => {
            // console.log('data', store.messages.length)
            setData([...store.messages]);
        }
        window.addEventListener('message', handleData);
    }, []);
    useEffect(() => {
        if (drawerContentRef.current) {
            drawerContentRef.current.scrollTop = drawerContentRef.current.scrollHeight;
        }
    }, [data]);

    return (
        <>
            <LeftOutlined onClick={showDrawer} className="drawer-button" />
            <Drawer title="事件看板" onClose={onClose} open={open} mask={false}>
                <div ref={drawerContentRef} style={{ maxHeight: '100%', overflowY: 'auto' }}>
                    {data.map((item, index) => (
                        <p key={index}>{item}</p>
                    ))}
                </div>
            </Drawer>
        </>
    );
}


createRoot(document.getElementById('app')).render(<App/>);

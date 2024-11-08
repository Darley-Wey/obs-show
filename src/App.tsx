import './App.css'
import React, {useState} from "react";
import {Drawer} from "antd";
import {LeftOutlined} from "@ant-design/icons";
import {createRoot} from "react-dom/client";

const App: React.FC = () => {
    const [open, setOpen] = useState(false);
    const showDrawer = () => {
        setOpen(true);
    };
    const onClose = () => {
        setOpen(false);
    };
    return (
        <>
            <LeftOutlined onClick={showDrawer} className="drawer-button" />
            <Drawer title="Basic Drawer" onClose={onClose} open={open} mask={false}>
                <p>Some contents...</p>
                <p>Some contents...</p>
                <p>Some contents...</p>
            </Drawer>
        </>
    );
}


createRoot(document.getElementById('app')).render(<App/>);

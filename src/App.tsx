import React, {useEffect, useRef, useState} from "react";
import {createRoot} from "react-dom/client";
import {EventDrawer} from "./components/EventDrawer";
import {Map} from "./map/Map";
import {store} from "./map/config";
import {ConfigProvider} from "antd";
import zhCN from 'antd/locale/zh_CN';
import {DevSupport} from "@react-buddy/ide-toolbox";
import {ComponentPreviews, useInitial} from "./dev";

const App: React.FC = () => {
    const [data, setData] = useState([]);
    const mapRef = useRef(null)

    useEffect(() => {
        const handleData = () => {
            // console.log('data', store.messages.length)
            setData([...store.messages]);
        }
        window.addEventListener('message', handleData);
        window.electronAPI?.onReceiveMessage((value: Packet) => {
            mapRef.current.updatePacket(value);
        });
    }, []);

    return (
        <>
            <EventDrawer data={data}/>
            <Map ref={mapRef}/>
        </>
    );
}


createRoot(document.getElementById('app')).render(
    <ConfigProvider locale={zhCN}>
        <DevSupport ComponentPreviews={ComponentPreviews}
                    useInitialHook={useInitial}
        >
            <App/>
        </DevSupport>
    </ConfigProvider>
);

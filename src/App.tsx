import React, {useEffect, useRef, useState} from "react";
import {createRoot} from "react-dom/client";
import {EventDrawer} from "./components/EventDrawer";
import {Map} from "./map/Map";
import {store} from "./map/config";

const App: React.FC = () => {
    const [data, setData] = useState([]);
    const mapRef = useRef(null)

    useEffect(() => {
        const handleData = () => {
            // console.log('data', store.messages.length)
            setData([...store.messages]);
        }
        window.addEventListener('message', handleData);
        window.electronAPI.onReceiveMessage((value: Packet) => {
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


createRoot(document.getElementById('app')).render(<App/>);

import React, {useEffect, useState} from "react";
import {createRoot} from "react-dom/client";
import {EventDrawer} from "./components/EventDrawer";
import {Map} from "./map/Map";
import {store} from "./map/config";

const App: React.FC = () => {
    const [data, setData] = useState([]);

    useEffect(() => {
        const handleData =  () => {
            // console.log('data', store.messages.length)
            setData([...store.messages]);
        }
        window.addEventListener('message', handleData);
    }, []);

    return (
        <>
            <EventDrawer data={data}/>
            <Map/>
        </>
    );
}


createRoot(document.getElementById('app')).render(<App/>);

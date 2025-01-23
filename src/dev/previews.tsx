import {ComponentPreview, Previews} from "@react-buddy/ide-toolbox";
import React from "react";
import {ExampleLoaderComponent, PaletteTree} from "./palette";
import {EventDrawer} from "../components/EventDrawer";
import {Map} from "../map/Map";

interface ComponentPreviewsProps {
    data: string[]
}

const ComponentPreviews = ({data}: ComponentPreviewsProps) => {
    return (
        <Previews palette={<PaletteTree/>}>
            <ComponentPreview path="/ExampleLoaderComponent">
                <ExampleLoaderComponent/>
            </ComponentPreview>
            <ComponentPreview path="/Map">
                <Map/>
            </ComponentPreview>
            <ComponentPreview path="/EventDrawer">
                <EventDrawer data={data}/>
            </ComponentPreview>
        </Previews>
    );
};

export default ComponentPreviews;

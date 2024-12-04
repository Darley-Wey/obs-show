/// <reference types="@electron-forge/plugin-vite/forge-vite-env" />
export interface IElectronAPI {
    onReceiveMessage: (callback: (value: Packet) => void) => void,
    process: NodeJS.Process,
    getResourcesPath: () => string,
}

declare global {
    const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
    const MAIN_WINDOW_VITE_NAME: string;

    interface Window {
        electronAPI: IElectronAPI
    }
}

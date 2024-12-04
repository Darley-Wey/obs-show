// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import {contextBridge, ipcRenderer} from "electron";

let resourcesPath = ''
ipcRenderer.invoke('get-resources-path', '').then((path) => {
    console.log('preload.js loaded', path);
    const isDev = process.env.NODE_ENV === 'development';
    resourcesPath = isDev ? '' : path;
})

contextBridge.exposeInMainWorld('electronAPI', {
    onReceiveMessage: (callback) => ipcRenderer.on('receive-message', (_event, value) => callback(value)),
    process: process,
    getResourcesPath: () => resourcesPath,
})

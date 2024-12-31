import {app, BrowserWindow, Menu, MenuItem, ipcMain} from 'electron';
import {installExtension, REACT_DEVELOPER_TOOLS} from 'electron-devtools-installer';
import path from 'path';
import dgram from "node:dgram";
import started from 'electron-squirrel-startup'


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
    app.quit();
}

const menu = new Menu()
menu.append(new MenuItem({
    label: 'View',
    visible: false,  // 无效,在创建窗口时再次设置
    submenu: [
        {
            role: 'reload',
            accelerator: 'F5',
        },
        {
            role: 'togglefullscreen',
        },
        {
            role: 'toggleDevTools',
            accelerator: 'F12',
        },
    ]
}))
Menu.setApplicationMenu(menu)

const createWindow = async () => {
    installExtension(REACT_DEVELOPER_TOOLS)
        .then((ext) => console.log(`Added Extension:  ${ext.name}`))
        .catch((err) => console.log('An error occurred: ', err));
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: false,
        },
        autoHideMenuBar: true, // 隐藏菜单栏，只绑定快捷键
    });
    ipcMain.handle('get-resources-path', () => process.resourcesPath);
    // and load the index.html of the app.
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        await mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        await mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();
    // 解决关闭 DevTools 时缩放按钮异常获取了焦点
    mainWindow.webContents.on('devtools-closed', () => {
        mainWindow.webContents.executeJavaScript("document.querySelector('.ol-zoom-in').blur();");
    });

    const server = dgram.createSocket('udp4');
    server.on('error', (err) => {
        console.error(`server error:\n${err.stack}`);
        server.close();
    });

    server.on('message', (msg) => {
        // console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
        mainWindow.webContents.send('receive-message', JSON.parse(msg.toString()));
    });

    server.on('listening', () => {
        const address = server.address();
        console.log(`server listening ${address.address}:${address.port}`);
    });

    server.bind(41234);
    // Prints: server listening 0.0.0.0:41234
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', async () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        await createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

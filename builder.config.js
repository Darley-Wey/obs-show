"use strict"

import builder from "electron-builder"
import fs from "fs"
import path from "path"


const afterPack = async (context) => {
    // 要删除的文件列表
    const filesToRemove = [
        'vk_swiftshader.dll',
        'vulkan-1.dll',
        'LICENSES.chromium.html'
    ]

    for (const file of filesToRemove) {
        const filePath = path.join(context.appOutDir, file)
        if (fs.existsSync(filePath)) {
            console.log(`Removing ${file}...`)
            fs.unlinkSync(filePath)
        }
    }
}

// Let's get that intellisense working
/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration
 */
const options = {
    appId: "Com.ObsShow",
    // "store” | “normal” | "maximum". - For testing builds, use 'store' to reduce build time significantly.
    compression: "normal",
    removePackageScripts: true,
    nodeGypRebuild: false,
    buildDependenciesFromSource: false,
    electronLanguages: ["en-US", "zh-CN"],
    extraFiles: [],
    files: [
        "!out",
        "!public",
        "!**/node_modules/**",
    ],
    extraResources: [
        {
            from: "public/icons",
            to: "icons",
        }
    ],
    win: {
        target: 'nsis'
    },
    nsis: {
        deleteAppDataOnUninstall: true,
    },
    afterPack: afterPack,
};

// Promise is returned
builder.build({
    config: options,
})
    .then((result) => {
        console.log(JSON.stringify(result))
    })
    .catch((error) => {
        console.error(error)
    })

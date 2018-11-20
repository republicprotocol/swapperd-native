const menubar = require("menubar");
const Menu = require("electron").Menu;
const express = require("express");
const bodyParser = require("body-parser");
const ipcMain = require("electron").ipcMain;
const shell = require("shelljs");

const mb = menubar({
    tooltip: "Swapperd",
    showDockIcon: true,
    webPreferences: {
        nodeIntegration: false,
        preload: __dirname + "/preload.js"
    }
});
const app = express();

mb.on("ready", function ready() {
    const application = {
        label: "Application",
        submenu: [
            {
                label: "About",
                selector: "orderFrontStandardAboutPanel:"
            },
            {
                type: "separator"
            },
            {
                label: "Quit",
                accelerator: "Command+Q",
                click: () => {
                    app.quit()
                }
            }
        ]
    };

    const edit = {
        label: "Edit",
        submenu: [
            {
                label: "Undo",
                accelerator: "CmdOrCtrl+Z",
                selector: "undo:"
            },
            {
                label: "Redo",
                accelerator: "Shift+CmdOrCtrl+Z",
                selector: "redo:"
            },
            {
                type: "separator"
            },
            {
                label: "Cut",
                accelerator: "CmdOrCtrl+X",
                selector: "cut:"
            },
            {
                label: "Copy",
                accelerator: "CmdOrCtrl+C",
                selector: "copy:"
            },
            {
                label: "Paste",
                accelerator: "CmdOrCtrl+V",
                selector: "paste:"
            },
            {
                label: "Select All",
                accelerator: "CmdOrCtrl+A",
                selector: "selectAll:"
            }
        ]
    };

    const template = [
        application,
        edit
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
});

mb.on("after-create-window", () => {
    mb.window.openDevTools();
});

app.use(bodyParser.json());
app.post("/swaps", (req, res) => {
    mb.window.webContents.send("swap", req.body)
    ipcMain.on("swapresponse", (event, ...args) => {
        res.status(201);
        res.send(args[0]);
    });
});
app.listen(7929);

ipcMain.on("create-account", (event, ...args) => {
    shell.exec(`curl https://releases.republicprotocol.com/test/install.sh -sSf | sh -s testnet ${args[0]} ${args[1]}`, (code) => {
        event.returnValue = code;
    });
})
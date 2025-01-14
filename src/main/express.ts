import * as bodyParser from "body-parser";
import express from "express";

import axios from "axios";

import { MenubarApp, showWindow } from "./menubar";

import { version } from "../../package.json";

import {
    dim,
    highlight,
    log,
    reset,
} from "./mainIpc";

import { IPC } from "common/ipc";
import { swapperEndpoint } from "common/swapperD";
import { Message } from "common/types";

const PORT = 7928;

export const setupExpress = (mb: MenubarApp, ipc: IPC) => {
    const expressApp = express();

    expressApp.use(bodyParser.json());
    expressApp.use((_req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    expressApp.get("/network", async (_req, res) => {
        const network = await ipc.sendSyncWithTimeout(Message.GetNetwork, 10, null);
        res.status(200);
        res.send(network);
    });

    expressApp.get("/version", async (_req, res) => {
        res.status(200);
        res.send(version);
    });

    expressApp.post("/swaps", async (req, res) => {
        log(`${highlight}expressApp${reset}${dim}: ${req.url}`);

        showWindow(mb);

        // tslint:disable-next-line: no-any
        const response = await ipc.sendSyncWithTimeout(Message.Swap, 0, {
            body: req.body,
            network: req.query.network,
            origin: req.headers.origin,
        });

        res.status(response.status);
        res.send(response.response === undefined ? "" : response.response);
    });

    expressApp.get("/*", async (req, res) => {
        log(`${highlight}expressApp${reset}${dim}: ${req.url}`);

        const swapperDUrl = `${swapperEndpoint(req.query.network)}${req.path}`;

        let password: string;
        try {
            password = await ipc.sendSyncWithTimeout(Message.GetPassword, 10, null);
        } catch (err) {
            res.status(401);
            res.send("Wallet is locked");
            return;
        }

        let postResponse;
        try {
            postResponse = await axios({
                method: "GET",
                url: swapperDUrl,
                auth: {
                    username: "",
                    password,
                },
            });
        } catch (error) {
            if (error.response) {
                res.status(error.response.status);
                res.send(error.response.data);
            } else {
                res.status(502);
                res.send(error.toString());
            }
            return;
        }

        res.status(200);
        res.send(postResponse.data);
    });

    expressApp.listen(PORT);
};

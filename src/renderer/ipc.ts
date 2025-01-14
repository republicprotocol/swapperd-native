// tslint:disable: no-any

import { ipcRenderer } from "electron";

import { IPC } from "common/ipc";

// import { ipcRenderer } from "electron";

export type IPCResponse<T> = [T, Error];

// const log = process.env.NODE_ENV === "development" ? logger.info : () => null;

export const ipc = new IPC(ipcRenderer, () => ipcRenderer);

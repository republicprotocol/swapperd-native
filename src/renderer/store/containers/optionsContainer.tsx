import Store from "electron-store";

import { Container } from "unstated";

import { OptionsData } from "@/store/storeTypes";
import { Network } from "common/types";

const store = new Store();

const STORAGE_KEY = "userOptions";

const initialState: OptionsData = {
    network: Network.Mainnet,
    hideZeroBalances: false,
};

export class OptionsContainer extends Container<OptionsData> {
    public state = initialState;

    constructor() {
        super();
        this.restore();
    }

    // Trader data
    public setNetwork = async (network: Network) => {
        await this.setState({ network });
        // Preserve the network state in local storage
        await this.preserve();
    }

    private preserve = async (): Promise<void> => {
        store.set(STORAGE_KEY, this.state);
    }

    private restore = async (): Promise<void> => {
        // Restore the previous state
        const previousState = store.get(STORAGE_KEY, initialState);
        await this.setState(previousState);
    }
}
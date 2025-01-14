import { Container } from "unstated";

import { ApplicationData } from "@/store/storeTypes";
import { getBalances, getSwaps, getTransfers, IBalances, ISwapsResponse, ITransfersResponse } from "common/swapperD";
import { Network } from "common/types";

const initialState: ApplicationData = {
    app: {
        updateReady: null,
        updatingSwapperD: false,
        installProgress: null,
    },
    login: {
        password: null,
    },
    trader: {
        balances: new Map<Network, IBalances>(),
        swaps: new Map<Network, ISwapsResponse>(),
        transfers: new Map<Network, ITransfersResponse>(),
    },
};

export class AppContainer extends Container<ApplicationData> {
    public state = initialState;

    // App data
    public setUpdateReady = async (version: string) =>
        this.setState({ app: { ...this.state.app, updateReady: version } })
    public clearUpdateReady = async () =>
        this.setState({ app: { ...this.state.app, updateReady: null } })
    public setInstallProgress = async (percent: number | null) =>
        this.setState({ app: { ...this.state.app, installProgress: percent } })

    // Login data
    public setPassword = async (password: string) =>
        this.setState({ login: { ...this.state.login, password } })
    public clearPassword = async () =>
        this.setState({ login: { ...this.state.login, password: null } })

    // SwapperD Updating state
    public setUpdatingSwapperD = async (updating: boolean) =>
        this.setState({ app: { ...this.state.app, updatingSwapperD: updating } })

    /**
     * updateBalances fetches and updates the balances from SwapperD.
     *
     * @throws an error if the call to getBalances() failed
     */
    public updateBalances = async (network: Network): Promise<void> => {
        const { login: { password } } = this.state;
        if (password !== null) {
            const balances = await getBalances({ network, password });
            const currentBalances = this.state.trader.balances.get(network);
            if (!balances.equals(currentBalances)) {
                const newBalances = this.state.trader.balances.set(network, balances);
                await this.setState({ trader: { ...this.state.trader, balances: newBalances } });
            }
        }
    }

    public updateTransfers = async (network: Network): Promise<void> => {
        const { login: { password } } = this.state;
        if (password !== null) {
            const transfers = await getTransfers({ network, password });
            const newTransfers = this.state.trader.transfers.set(network, transfers);
            await this.setState({ trader: { ...this.state.trader, transfers: newTransfers } });
        }
    }

    public updateSwaps = async (network: Network): Promise<void> => {
        const { login: { password } } = this.state;
        if (password !== null) {
            const swaps = await getSwaps({ network, password });
            const newSwaps = this.state.trader.swaps.set(network, swaps);
            await this.setState({ trader: { ...this.state.trader, swaps: newSwaps } });
        }
    }
}

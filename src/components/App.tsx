import * as React from 'react';

import '../styles/App.css';

import ApproveSwap from './ApproveSwap';

import { checkAccountExists, getBalances, IBalancesResponse, IPartialSwapRequest, IPartialWithdrawRequest } from '../lib/swapperd';
import { ApproveWithdraw } from './ApproveWithdraw';
import { Balances } from './Balances';
import { Banner } from './Banner';
import { CreateAccount } from './CreateAccount';

interface IAppState {
    accountExists: boolean;
    swapDetails: IPartialSwapRequest | null;
    withdrawRequest: IPartialWithdrawRequest | null;
    balances: IBalancesResponse | null;
    balancesError: string | null;
}

class App extends React.Component<{}, IAppState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            accountExists: false,
            swapDetails: null,
            withdrawRequest: null,
            balances: null,
            balancesError: null,
        }
        this.accountCreated = this.accountCreated.bind(this);
        this.rejectSwap = this.rejectSwap.bind(this);
    }

    public async componentDidMount() {
        try {
            const accountExists = await checkAccountExists();
            this.setState({ accountExists });
        } catch (e) {
            console.log(e);
        }

        try {
            const balances = await getBalances();
            this.setState({ balances });
        } catch (err) {
            this.setState({ balancesError: err.message });
        }

        const ws = new WebSocket('ws://localhost:8080');
        ws.onopen = () => {
            ws.send("connect");
        };
        ws.onmessage = (evt) => {
            try {
                const swapDetails = JSON.parse(evt.data);
                this.setState({ swapDetails });
            } catch (e) {
                console.log(e);
            }
        };
    }

    public render() {
        const { accountExists, swapDetails, withdrawRequest, balances, balancesError } = this.state;

        if (!accountExists) {
            return <div className="app">
                <Banner title="Create account" />
                <CreateAccount resolve={this.accountCreated} />
            </div>
        }

        if (swapDetails) {
            return <div className="app">
                <Banner title="Approve swap" />
                <ApproveSwap swapDetails={swapDetails} reject={this.rejectSwap} />
            </div>
        }

        if (withdrawRequest) {
            return <div className="app">
                <Banner title="Withdraw" />
                <ApproveWithdraw
                    setWithdrawRequest={this.setWithdrawRequest}
                    withdrawRequest={withdrawRequest}
                    balances={balances}
                />
            </div>
        }

        return <div className="app">
            <Banner title="Balances" />
            <Balances balances={balances} balancesError={balancesError} setWithdrawRequest={this.setWithdrawRequest} />
        </div>;
    }

    public setWithdrawRequest = (withdrawRequest: IPartialWithdrawRequest | null) => {
        this.setState({ withdrawRequest });
    }

    private accountCreated(): void {
        this.setState({ accountExists: true });
    }

    private rejectSwap(): void {
        this.setState({ swapDetails: null });
    }
}

export default App;

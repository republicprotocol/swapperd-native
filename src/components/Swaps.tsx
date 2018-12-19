import * as React from "react";

import BigNumber from "bignumber.js";
import { ISwapItem, ISwapsResponse } from "../lib/swapperd";
import { Banner } from "./Banner";
import { Loading } from "./Loading";
import { SwapItem } from "./SwapItem";

interface ISwapsProps {
    swaps: null | ISwapsResponse;
}

interface ISwapsState {
    pending: ISwapItem[];
}

export class Swaps extends React.Component<ISwapsProps, ISwapsState> {
    constructor(props: ISwapsProps) {
        super(props);
        this.state = {
            pending: [],
        };
    }

    public componentDidMount(): void {
        const { swaps } = this.props;
        if (swaps && swaps.swaps) {
            const pending = this.pendingSwaps(swaps.swaps);
            this.setState({ pending });
        }
    }

    public componentWillReceiveProps(nextProps: ISwapsProps): void {
        const { swaps } = nextProps;
        if (swaps && swaps.swaps) {
            const pending = this.pendingSwaps(swaps.swaps);
            if (pending.length < this.state.pending.length) {
                const notPending = this.state.pending.filter((current) => {
                    return pending.filter((other) => {
                        return other.id === current.id;
                    }).length === 0;
                });
                for (const swap of notPending) {
                    // Retrieve the new status of the swap.
                    const newSwap = swaps.swaps.find(x => x.id === swap.id);
                    if (!newSwap) {
                        continue;
                    }
                    let status;
                    switch (newSwap.status) {
                        case 4:
                            status = "confirmed!";
                            break;
                        case 6:
                            status = "canceled.";
                            break;
                        default:
                            status = "failed.";
                            break;
                    }
                    const sendAmount = new BigNumber(newSwap.sendAmount).plus(new BigNumber(newSwap.sendCost[newSwap.sendToken])).toFixed();
                    const receiveAmount = new BigNumber(newSwap.receiveAmount).minus(new BigNumber(newSwap.receiveCost[newSwap.receiveToken])).toFixed();
                    const notificationMessage = `Swap from ${sendAmount} ${newSwap.sendToken} to ${receiveAmount} ${newSwap.receiveToken} ${status}`;
                    (window as any).ipcRenderer.sendSync("notify", notificationMessage);
                }
            }
            if (pending !== this.state.pending) {
                this.setState({ pending });
            }
        }
    }

    public render(): JSX.Element {
        const { swaps } = this.props;
        return (
            <>
                <Banner title="History" />
                <div className="swaps">
                    {swaps !== null ?
                        swaps.swaps !== null ?
                            swaps.swaps.sort((a, b) => {
                                // Sort by timestamp in descending order
                                if (a.timestamp < b.timestamp) {
                                    return 1;
                                } else if (a.timestamp > b.timestamp) {
                                    return -1;
                                } else {
                                    return a.id.localeCompare(b.id);
                                }
                            }).map((swap, index) => {
                                return <SwapItem key={index} swapItem={swap} />;
                            })
                            :
                            <p>You have no transactions.</p>
                        :
                        <Loading />
                    }
                </div>
            </>
        );
    }

    private pendingSwaps(swaps: ISwapItem[]): ISwapItem[] {
        const pending = [];
        for (const swap of swaps) {
            if (swap.status === 0 || swap.status === 1 || swap.status === 2) {
                pending.push(swap);
            }
        }
        return pending;
    }
}

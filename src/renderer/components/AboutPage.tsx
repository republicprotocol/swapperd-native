import * as React from "react";

import { Circle } from "rc-progress";

import { ipc } from "@/ipc";
import { connect, ConnectedProps } from "@/store/connect";
import { AppContainer } from "@/store/containers/appContainer";
import { Message } from "common/types";
import { Banner } from "./Banner";
import { Loading } from "./Loading";
import { Options } from "./Options";

interface IAboutPageProps extends ConnectedProps {
    updateAvailable: boolean;
    latestSwapperdVersion: string | null;
    swapperdBinaryVersion: string | null;
    swapperdDesktopVersion: string;
    updateCompleteCallback?(): void;
}

interface IAboutPageState {
    updateComplete: boolean;
    error: string | null;
    restarting: boolean;
}

class AboutPageClass extends React.Component<IAboutPageProps, IAboutPageState> {
    private readonly appContainer: AppContainer;

    constructor(props: IAboutPageProps) {
        super(props);
        this.state = {
            updateComplete: false,
            error: null,
            restarting: false,
        };
        [this.appContainer] = this.props.containers;
    }

    // tslint:disable-next-line:cyclomatic-complexity
    public render() {
        const { updateAvailable, latestSwapperdVersion, swapperdBinaryVersion, swapperdDesktopVersion } = this.props;
        const { error, updateComplete, restarting } = this.state;
        const { updatingSwapperd, updateReady } = this.appContainer.state.app;
        const { password } = this.appContainer.state.login;
        const locked = password === "" || password === null;

        const binaryNeedsUpdate = !updateComplete && updateAvailable && latestSwapperdVersion !== null && swapperdBinaryVersion !== null;
        const desktopNeedsUpdate = updateReady !== null;
        const showUpdate = binaryNeedsUpdate || desktopNeedsUpdate;
        const noticeMessage = (binaryNeedsUpdate) ? "An update is available! Click the button below to update." : "An update has been installed. Please restart the app for the changes to take effect.";

        const progress = this.appContainer.state.app.installProgress;

        return <div className={`about--page ${showUpdate ? "update--available" : ""}`}>
            <Banner title="Settings" />
            <Options />
            <div className="about--footer">
                {!locked && showUpdate && <div className="notice notice--alert">{noticeMessage}</div>}
                {!locked && error && <p className="error">{error}</p>}
                <div className="about--footer--content">
                    <div>
                        <div className="version-banner">Binary version: <span>{swapperdBinaryVersion || "Unknown"}</span></div>
                        <div className="version-banner">UI version: <span>{swapperdDesktopVersion}</span></div>
                    </div>
                    {!locked && showUpdate ?
                        <div className="update--button">
                            {updatingSwapperd ? <div className="updating">
                                <Circle percent={progress || 0} strokeWidth="4" className="progress" /></div> :
                                <>
                                    {binaryNeedsUpdate ?
                                        <button className="update" onClick={this.onUpdateHandler}>Update</button> :
                                        <button disabled={restarting} className="update" onClick={this.onRestartHandler}>Restart</button>
                                    }
                                </>
                            }
                        </div> : null}
                </div>
            </div>
        </div>;
    }

    private readonly onUpdateHandler = async (): Promise<void> => {
        const { updateCompleteCallback } = this.props;
        this.setState({ error: null });
        await this.appContainer.setUpdatingSwapperd(true);
        try {
            await ipc.sendSyncWithTimeout(
                Message.UpdateSwapperd,
                0, // timeout
                { swapperd: true, restart: false }
            );
            await this.appContainer.setUpdatingSwapperd(false);
            this.setState({ updateComplete: true });
            if (updateCompleteCallback) {
                updateCompleteCallback();
            }
        } catch (error) {
            console.error(`Got error instead!!!: ${error}`);
            await this.appContainer.setUpdatingSwapperd(false);
            this.setState({ error });
            return;
        }
    }

    private readonly onRestartHandler = async (): Promise<void> => {
        this.setState({ error: null, restarting: true });
        try {
            await ipc.sendSyncWithTimeout(
                Message.UpdateSwapperd,
                0, // timeout
                { swapperd: false, restart: true }
            );
            this.setState({ restarting: false });
        } catch (error) {
            this.setState({ restarting: false, error });
            return;
        }
    }
}

export const AboutPage = connect<IAboutPageProps>([AppContainer])(AboutPageClass);

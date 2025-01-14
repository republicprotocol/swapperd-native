import * as React from "react";

import logger from "electron-log";

import { Circle } from "rc-progress";

import { Banner } from "@/components/Banner";
import { Loading } from "@/components/Loading";
import { ipc } from "@/ipc";
import { connect, ConnectedProps } from "@/store/connect";
import { AppContainer } from "@/store/containers/appContainer";
import { swapperDReady } from "common/swapperD";
import { Message } from "common/types";

interface Props extends ConnectedProps {
    resolve(mnemonic: string, password: string): void;
}

interface State {
    mnemonic: string | null;
    username: string;
    password: string;
    password2: string;
    useMnemonic: boolean;
    loading: boolean;
    submitError: string | null;
}

// tslint:disable-next-line: no-any
export const renderError = (errorIn: any) => {
    const error = errorIn.message || errorIn;

    if (typeof error === "string") {
        return error;
    } else {
        try {
            return JSON.stringify(error);
        } catch (_err) {
            return `${_err}`;
        }
    }
};

export class CreateAccountClass extends React.Component<Props, State> {
    private readonly appContainer: AppContainer;

    constructor(props: Props) {
        super(props);
        this.state = {
            mnemonic: null,
            username: "",
            password: "",
            password2: "",
            useMnemonic: false,
            loading: false,
            submitError: null,
        };
        [this.appContainer] = this.props.containers;
    }

    // tslint:disable-next-line:cyclomatic-complexity
    public render(): JSX.Element {
        const { useMnemonic, loading, username, password, password2, mnemonic, submitError } = this.state;

        // Disable password length enforcing for account restoration
        const passwordValid = useMnemonic || password.length >= 8;
        const passwordsMatch = password && password2 && password === password2;

        let inputError = null;
        if (password && !passwordValid) {
            inputError = "Your password needs to be at least 8 characters long";
        } else if (password2 && !passwordsMatch) {
            inputError = "Your passwords do not match";
        }

        const validForm = username && passwordsMatch && passwordValid;
        const disabled: boolean = inputError !== null || !validForm || (useMnemonic && !mnemonic);

        const progress = this.appContainer.state.app.installProgress;

        return <div className="create-account">
            <Banner title={useMnemonic ? "Import account" : "Create account"} />
            <div className="account">
                {!loading ?
                    <form onSubmit={this.handleSubmit}>
                        {useMnemonic &&
                            <textarea name="mnemonic" placeholder="Please enter your 12 word mnemonic here" onChange={this.handleTextArea} />
                        }
                        <input type="text" name="username" placeholder="Username" onChange={this.handleInput} />
                        <input type="password" name="password" placeholder={`Password${useMnemonic ? " (this must be identical to the one you used originally)" : ""}`} onChange={this.handleInput} />
                        <input type="password" name="password2" placeholder="Confirm password" onChange={this.handleInput} />
                        {inputError ? <p className="error">{inputError}</p> : ""}
                        <button disabled={disabled}>{useMnemonic ? "Import" : "Create"} account</button>
                        {!useMnemonic ?
                            // tslint:disable-next-line:react-a11y-anchors
                            <a role="button" onClick={this.restoreWithMnemonic}>Import using a mnemonic instead</a>
                            :
                            // tslint:disable-next-line:react-a11y-anchors
                            <a role="button" onClick={this.restoreWithoutMnemonic}>Create new account instead</a>
                        }
                    </form> :
                    submitError ?
                        <div>
                            Unable to create account
                                    <details style={{ whiteSpace: "pre-wrap" }}>
                                {submitError}
                            </details>
                            <button onClick={this.retry}>Retry</button>
                            <button className="button--light" onClick={this.cancel}>Cancel</button>
                        </div> :
                        <>

                            <Loading />
                            <Circle percent={progress || 0} strokeWidth="4" className="progress" />
                            <span>
                                Setting up your account. This could take a few minutes...
                        </span>
                        </>
                }
            </div>
        </div >;
    }

    private readonly handleTextArea = (event: React.FormEvent<HTMLTextAreaElement>): void => {
        const element = (event.target as HTMLTextAreaElement);
        this.setState((state) => ({ ...state, [element.name]: element.value }));
    }

    private readonly handleInput = (event: React.FormEvent<HTMLInputElement>): void => {
        const element = (event.target as HTMLInputElement);
        this.setState((state) => ({ ...state, [element.name]: element.value }));
    }

    private readonly retry = async (): Promise<void> => {
        await this.createAccount(false);
    }

    private readonly cancel = async (): Promise<void> => {
        this.setState({ loading: false, submitError: null });
    }

    private readonly handleSubmit = async (): Promise<void> => {
        // Ensure username does not contain any whitespace
        // if (/\s/.test(this.state.username)) {
        //     this.setState({ error: "Please enter a valid username." });
        // }
        await this.createAccount();
    }

    private readonly createAccount = async (skipInstall?: boolean): Promise<void> => {
        this.setState({ loading: true, submitError: null });
        const { useMnemonic, mnemonic, password } = this.state;
        let newMnemonic: string = mnemonic || "";
        try {
            if (!skipInstall) {
                newMnemonic = await ipc.sendSyncWithTimeout(
                    Message.CreateAccount,
                    0, // timeout
                    { password, mnemonic }
                );
            }

            await swapperDReady(password);
            this.setState({ loading: false, submitError: null });
            // If the user provided a mnemonic, there is no point passing the new one to the parent
            this.props.resolve(useMnemonic ? "" : newMnemonic, password);
        } catch (error) {
            logger.error(error);
            this.setState({ mnemonic: newMnemonic, submitError: renderError(error) });
        }
        await this.appContainer.setInstallProgress(null);
    }

    private readonly restoreWithMnemonic = (): void => {
        this.setState({ useMnemonic: true });
    }

    private readonly restoreWithoutMnemonic = (): void => {
        this.setState({ useMnemonic: false });
    }
}

export const CreateAccount = connect<Props>([AppContainer])(CreateAccountClass);

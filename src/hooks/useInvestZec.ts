
import { useState } from "react";
import { useConnectWallet } from "./useConnectWallet";
import { useNearWalletActions } from "./useNearWalletActions";
import { SignAndSendTransactionsParams } from "@/types/interfaces";
import { v4 as uuidv4 } from 'uuid';
import { useCapitalHook } from "./useCapitalHook";

export type Asset = {
    defuse_asset_id: string;
    decimals: number;
    blockchain: string;
    symbol: string;
    contract_address?: string;
    score: number;
    share: number;
};

function toAtomicUnits(balance: number, decimals: number = 8): bigint {
    return BigInt(Math.round(balance * Math.pow(10, decimals)));
}


export const useInvestZec = () => {
    const { state } = useConnectWallet();
    const { createCapital } = useCapitalHook();
    const nearWalletConnect = useNearWalletActions()
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);


    // This function helps to deposit zec fund from user's intent wallet to contract intent wallet
    const investZec = async ({ amount, tokens }: { amount: string, tokens: Asset[] }) => {

        const numericAmount = parseFloat(amount); // Convert string to number
        if (isNaN(numericAmount)) {
            setError("Invalid amount");
            return;
        }

        const parsedAmount = toAtomicUnits(numericAmount);
        console.log(parsedAmount);

        const params: SignAndSendTransactionsParams = {
            transactions: [
                {
                    signerId: state.address,
                    receiverId: "intents.near",
                    actions: [
                        {
                            type: "FunctionCall",
                            params: {
                                methodName: "mt_transfer_call",
                                args: {
                                    receiver_id: "zec-intents.near",
                                    token_id: "nep141:zec.omft.near",
                                    amount: parsedAmount.toString(), // "100000",
                                    approval: null,
                                    memo: null,
                                    msg: "Deposit ZEC"
                                },
                                gas: "300000000000000",
                                deposit: "1"
                            }
                        }
                    ]
                }
            ]
        };

        try {
            if (!state.address) {
                throw new Error("Please connect your NEAR wallet.");
            }
            setLoading(true);
            setError(null);

            const outcome = await nearWalletConnect.signAndSendTransactions(params);

            if (outcome) {
                // const uuid = uuidv4();
                // console.log(uuid);

                // const res = await createCapital({ capitalId: uuid, tokensToBuy: tokens, amount: parsedAmount.toString()});
                // console.log("Res: ", res)

                return { success: true, message: `Invest ZEC executed successfully!`, txHash: outcome };
            } else {
                return { success: false, message: "Transaction failed. No hash returned." };
            }
        } catch (err: any) {
            console.error("Error invest token:", err);
            setError("Transaction failed. Please try again.");
            return { success: false, message: err.message || "An error occurred" };
        } finally {
            setLoading(false);
        }
    };

    return { loading, error, investZec };
};


import { useState } from "react";
import { useConnectWallet } from "./useConnectWallet";
import { useNearWalletActions } from "./useNearWalletActions";
import { SignAndSendTransactionsParams } from "@/types/interfaces";
import { v4 as uuidv4 } from 'uuid';
import { useCapitalHook } from "./useCapitalHook";
import { INTENTS_CONTRACT_ID } from "@/utils/constants";

export type Asset = {
    defuse_asset_id: string;
    decimals: number;
    blockchain: string;
    symbol: string;
    contract_address?: string;
    score: number;
    share: number;
};

type quotesRequests = {
    toTokenAddress: string;
    amount: string;
}

function toAtomicUnits(balance: number, decimals: number = 8): bigint {
    return BigInt(Math.round(balance * Math.pow(10, decimals)));
}


export const useInvestZec = () => {
    const { state } = useConnectWallet();
    const { createCapital } = useCapitalHook();
    const nearWalletConnect = useNearWalletActions()
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchQuote = async ({ toTokenAddress, amount }: quotesRequests) => {
        const response = await fetch("https://solver-relay-v2.chaindefuser.com/rpc", {
            method: "POST",
            body: JSON.stringify({
                id: "dontcare",
                jsonrpc: "2.0",
                method: "quote",
                params: [
                    {
                        defuse_asset_identifier_in: "nep141:zec.omft.near",
                        defuse_asset_identifier_out: toTokenAddress,
                        exact_amount_in: amount,
                        min_deadline_ms: 60000,
                    },
                ],
            }),
            headers: { "Content-Type": "application/json" },
        });
        const json = await response.json();
        console.log("JSON:", json.result[0])
        return json.result[0];
    };


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
                    receiverId: INTENTS_CONTRACT_ID,
                    actions: [
                        {
                            type: "FunctionCall",
                            params: {
                                methodName: "mt_transfer",
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

            const quotes = await Promise.all(tokens.map(async (token) => {
                if (token.defuse_asset_id === "nep141:zec.omft.near") {
                    return {
                        ...token,
                        quote: null,
                        amount: "0"
                    };
                }

                const shareBigInt = BigInt(Math.round(token.share * 100));
                const tokenAmount = (parsedAmount * shareBigInt / BigInt(10000)).toString();

                const quote = await fetchQuote({
                    toTokenAddress: token.defuse_asset_id,
                    amount: tokenAmount,
                });

                return {
                    ...token,
                    quote,
                    amount: tokenAmount
                };
            }));

            console.log(quotes);

            const approvedTokens = quotes.filter(
                ({ quote }) =>
                    quote?.type !== "INSUFFICIENT_AMOUNT" &&
                    quote?.amount_out
            );

            if (approvedTokens.length === 0) {
                throw new Error("Insufficient amount to invest!");
            }

            if (approvedTokens.length === 1) {
                approvedTokens[0].share = 100
            }

            console.log("Approved Tokens:", approvedTokens);

            const outcome = await nearWalletConnect.signAndSendTransactions(params);

            if (outcome) {
                // const uuid = uuidv4();
                // console.log(uuid);

                const res = await createCapital({ depositHash: outcome as string, tokensToBuy: approvedTokens, amount: amount });
                console.log("Res: ", res)

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

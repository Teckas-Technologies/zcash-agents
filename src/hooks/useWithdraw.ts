"use client"

import { generateNonce, getBalance } from "@/utils/intentUtils";
import { fetchTokens } from "@/utils/rpcUtils";
import { useState } from "react";
import { useConnectWallet } from "./useConnectWallet";
import { useWalletAgnosticSignMessage } from "./useWalletAgnosticSignMessage";
import { ChainType } from "@/types/deposit";
import { publishIntent, waitForIntentSettlement } from "@/services/tokensUsdPricesHttpClient/intentService";

interface withdrawBody {
    assetInput: string,
    amountInput: string,
    toAddress: string
}

export const useWithdraw = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const { state } = useConnectWallet();
    const signMessage = useWalletAgnosticSignMessage()


    const withdrawToken = async (data: withdrawBody) => {

        const { assetInput, amountInput } = data;

        try {
            if (!state.address) {
                throw new Error("Please connect your NEAR wallet.");
            }
            setLoading(true);
            setError(null);
            const tokens = await fetchTokens();
            console.log("tokens:", tokens)

            const inputAsset = tokens?.find((token: any) => token.symbol.toLowerCase() === assetInput.toLowerCase());
            if (!inputAsset) {
                throw new Error("Invalid token symbol provided.");
            }

            // Optionally log the found assets
            console.log("Input Asset:", inputAsset);

            // Convert the amountInput based on the inputAsset decimals
            const amountInDecimal = Math.round(parseFloat(amountInput) * Math.pow(10, inputAsset.decimals));
            const adjustedAmount = BigInt(amountInDecimal);

            console.log(`Converted amount (with decimals): ${adjustedAmount.toString()}`);
            const balance = await getBalance(state.address, inputAsset?.contract_address || inputAsset?.defuse_asset_id.includes(":") ? inputAsset?.defuse_asset_id.split(":")[1] : inputAsset?.defuse_asset_id)
            console.log("BAL:", balance)

            if (BigInt(balance[0]) < adjustedAmount) {
                throw new Error("Insufficient balance.");
            }

            const deadline = new Date(Date.now() + 10 * 60 * 1000).toISOString()

            // Withdraw starts
            const standard = "nep413";
            const message = {
                deadline: deadline,
                signer_id: state.address,
                intents: [
                    {
                        intent: "ft_withdraw",
                        token: inputAsset?.contract_address || inputAsset?.defuse_asset_id.includes(":") ? inputAsset?.defuse_asset_id.split(":")[1] : inputAsset?.defuse_asset_id,
                        receiver_id: inputAsset?.contract_address || inputAsset?.defuse_asset_id.includes(":") ? inputAsset?.defuse_asset_id.split(":")[1] : inputAsset?.defuse_asset_id,
                        amount: adjustedAmount.toString(),
                        memo: `WITHDRAW_TO:${data.toAddress}`,
                    },
                ],
            };

            const messageStr = JSON.stringify(message);
            const nonce = await generateNonce(state.address);
            const recipient = "intents.near";

            const walletMessage = {
                ERC191: {
                    message: "Hello from Ethereum!"
                },
                NEP413: {
                    message: messageStr,
                    nonce: nonce,
                    recipient: recipient
                },
                SOLANA: {
                    message: "as" as any,
                },
                WEBAUTHN: {
                    challenge: "as" as any,
                    payload: "payloadData", // Add payload (string or any data structure you need)
                    parsedPayload: JSON.parse('{"someKey": "someValue"}') // Example parsedPayload (object)
                }
            }

            const result: any = await signMessage(walletMessage)

            console.log("RES", result)

            const userInfo = {
                userAddress: `ed25519:${state.address}`,
                userChainType: ChainType.Near
            }
            const publishResult = await publishIntent(result, userInfo, []);
            console.log("publishResult:", publishResult)

            if (publishResult.tag === "err") {
                throw new Error("Publish intent failed.");
            }

            // Wait for the intent to settle
            const abortController = new AbortController();
            const signal = abortController.signal;
            const settlementResult = await waitForIntentSettlement(signal, publishResult.value);

            console.log("Settlement Result:", settlementResult);

            // Handle settlement results
            if (settlementResult.status === "SETTLED") {
                console.log("Transaction settled:", settlementResult.txHash);
                return { success: true, message: `Withdraw executed successfully!`, txHash: settlementResult.txHash };
            }

            if (settlementResult.status === "NOT_FOUND_OR_NOT_VALID") {
                console.error("Intent not found or invalid.");
                return { success: false, message: "Transaction failed: Intent not found or invalid." };
            }


            return { success: false, message: "Transaction failed: Unknown error during settlement." };
        } catch (err: any) {
            console.error("Error withdraw token:", err);
            setError("Transaction failed. Please try again.");
            return { success: false, message: err.message || "An error occurred" };
        } finally {
            setLoading(false);
        }
    };

    return { loading, error, withdrawToken };
};

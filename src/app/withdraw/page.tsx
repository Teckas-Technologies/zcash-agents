"use client";

import { useConnectWallet } from "@/hooks/useConnectWallet"; // adjust import based on your structure
import { useState } from "react";
import { getNearPublicKeyFromLocalStorage, transformNEP141Signature } from "@/utils/myUtils";
import { generateNonce, getBalance, serializeIntent, signMessage } from "@/utils/intentUtils";
import bs58 from "bs58";
import { useNearWalletActions } from "@/hooks/useNearWalletActions";
import { base64 } from "@scure/base";
import { fetchIntentStatus } from "@/utils/rpcUtils";
import { useSwap } from "@/hooks/useSwap";
import { useWalletAgnosticSignMessage } from "@/hooks/useWalletAgnosticSignMessage";
import { publishIntent, waitForIntentSettlement } from "@/services/tokensUsdPricesHttpClient/intentService";
import { ChainType } from "@/types/deposit";
import { useWithdraw } from "@/hooks/useWithdraw";


export default function NearSwapTestPage() {
    const connectWallet = useConnectWallet();
    const { swapToken } = useSwap();
    const signMessage = useWalletAgnosticSignMessage()
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);

    const status = async () => {
        const res = await fetchIntentStatus("C1JgNAm9D9c4D2tKg8RE3FNapwUoAYvxctYX9735XSFj");
        console.log("RES: ", res)
    }

    console.log("Connected Address:", connectWallet.state.address)
    const nearWalletConnect = useNearWalletActions()

    const handleSwap = async () => {
        try {
            setLoading(true);

            if (!connectWallet.state.address) {
                return;
            }

            const deadline = new Date(Date.now() + 10 * 60 * 1000) // Add 10 minutes
                .toISOString() // Convert to ISO format
                // .replace("Z", "");

            console.log("deadline:", deadline)

            const standard = "nep413";
            // const message = {
            //     deadline: deadline,
            //     signer_id: connectWallet.state.address,
            //     intents: [
            //         {
            //             intent: "native_withdraw",
            //             receiver_id: connectWallet.state.address,
            //             amount: "500000000000000000000",
            //         },
            //     ],
            // };

            // Other chain withdraw
            const message = {
                deadline: deadline,
                signer_id: connectWallet.state.address,
                intents: [
                    {
                        intent: "ft_withdraw",
                        token: "zec.omft.near",
                        receiver_id: "zec.omft.near",
                        amount: "3000000",
                        memo: "WITHDRAW_TO:t1dHBJ4xicux2nAMwNGvoK1HbhXvdexhaFE", // WITHDRAW_TO:ADDRESS_ON_DESTINATION_CHAIN
                    },
                ],
            };

            const messageStr = JSON.stringify(message);
            console.log("Message being sent to the contract:", messageStr);
            const nonce = await generateNonce(connectWallet.state.address);
            const recipient = "intents.near";

            const res = await nearWalletConnect.signMessage({ message: messageStr, nonce, recipient: recipient });

            const signedData = {
                standard,
                payload: {
                    message: messageStr,
                    nonce: base64.encode(res.signedData.nonce),
                    recipient: res.signedData.recipient,
                    callbackUrl: res.signedData.callbackUrl,
                },
                signature: transformNEP141Signature(res.signatureData.signature),
                public_key: res.signatureData.publicKey,
            };

            console.log("Signed Data:", signedData);

            // Publish intent
            const publishIntentResponse = await fetch(
                "https://solver-relay-v2.chaindefuser.com/rpc",
                {
                    method: "POST",
                    body: JSON.stringify({
                        id: "dontcare",
                        jsonrpc: "2.0",
                        method: "publish_intent",
                        params: [
                            {
                                quote_hashes: [],
                                signed_data: signedData
                            },
                        ],
                    }),
                    headers: { "Content-Type": "application/json" },
                }
            );

            console.log("RES:", publishIntentResponse)

            const publishResult = await publishIntentResponse.json();
            setResult(`Intent published: ${JSON.stringify(publishResult)}`);

            // const walletMessage = {
            //     ERC191: {
            //         message: "Hello from Ethereum!"
            //     },
            //     NEP413: {
            //         message: messageStr,
            //         nonce: nonce,
            //         recipient: recipient
            //     },
            //     SOLANA: {
            //         message: "as" as any,
            //     },
            //     WEBAUTHN: {
            //         challenge: "as" as any,
            //         payload: "payloadData", // Add payload (string or any data structure you need)
            //         parsedPayload: JSON.parse('{"someKey": "someValue"}') // Example parsedPayload (object)
            //     }
            // }

            // const result: any = await signMessage(walletMessage)

            // console.log("RES", result)

            // const userInfo = {
            //     userAddress: `ed25519:${connectWallet.state.address}`,
            //     userChainType: ChainType.Near
            // }
            // const publishResult = await publishIntent(result, userInfo, []);
            // console.log("publishResult:", publishResult)

            // if (publishResult.tag === "err") {
            //     throw new Error("Publish intent failed.");
            // }

            // // Wait for the intent to settle
            // const abortController = new AbortController();
            // const signal = abortController.signal;
            // const settlementResult = await waitForIntentSettlement(signal, publishResult.value);

            // console.log("Settlement Result:", settlementResult);

            // // Handle settlement results
            // if (settlementResult.status === "SETTLED") {
            //     console.log("Transaction settled:", settlementResult.txHash);
            //     return { success: true, message: `Swap executed successfully!` };
            // }

            // if (settlementResult.status === "NOT_FOUND_OR_NOT_VALID") {
            //     console.error("Intent not found or invalid.");
            //     return { success: false, message: "Transaction failed: Intent not found or invalid." };
            // }
        } catch (err) {
            console.error(err);
            setResult("Withdraw failed.");
        } finally {
            setLoading(false);
        }
    };

    const { withdrawToken } = useWithdraw();

    const withdraw = async () => {
        const res = await withdrawToken({ assetInput: "ZEC", amountInput: "0.03", toAddress: "t1dHBJ4xicux2nAMwNGvoK1HbhXvdexhaFE"});
        console.log("RES:", res)
    }

    return (
        <div className="p-4 flex flex-col gap-4">
            <h1 className="text-xl font-bold">Test NEAR Withdraw via Intents</h1>
            <button onClick={withdraw} disabled={loading}>
                {loading ? "Processing Swap..." : "Withdraw Tokens"}
            </button>
            {result && <pre className="mt-4 whitespace-pre-wrap">{result}</pre>}
        </div>
    );
}

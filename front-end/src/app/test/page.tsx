"use client";

import { useConnectWallet, ChainType } from "@/hooks/useConnectWallet"; // adjust import based on your structure
import { useState } from "react";
import { getNearPublicKeyFromLocalStorage, transformNEP141Signature } from "@/utils/myUtils";
import { generateNonce, getBalance, serializeIntent, signMessage } from "@/utils/intentUtils";
import bs58 from "bs58";
import { useNearWalletActions } from "@/hooks/useNearWalletActions";
import { base64 } from "@scure/base";
import { fetchIntentStatus } from "@/utils/rpcUtils";
import { useSwap } from "@/hooks/useSwap";
import { SignAndSendTransactionsParams } from "@/types/interfaces";
import { useTransactionsHook } from "@/hooks/useTransactionsHook";


export default function NearSwapTestPage() {
    const connectWallet = useConnectWallet();
    const { swapToken } = useSwap();
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);

    const status = async () => {
        const res = await fetchIntentStatus("C1JgNAm9D9c4D2tKg8RE3FNapwUoAYvxctYX9735XSFj");
        console.log("RES: ", res)
    }

    const fetchQuote = async () => {
        const response = await fetch("https://solver-relay-v2.chaindefuser.com/rpc", {
            method: "POST",
            body: JSON.stringify({
                id: "dontcare",
                jsonrpc: "2.0",
                method: "quote",
                params: [
                    {
                        defuse_asset_identifier_in: "nep141:eth-0xdac17f958d2ee523a2206206994597c13d831ec7.omft.near",
                        defuse_asset_identifier_out: "nep141:wrap.near",
                        exact_amount_in: "10000",
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

    console.log("Connected Address:", connectWallet.state.address)
    const nearWalletConnect = useNearWalletActions()

    const handleSwap = async () => {
        try {
            setLoading(true);

            if (!connectWallet.state.address) {
                await connectWallet.signIn({ id: ChainType.Near });
            }

            const quote = await fetchQuote();

            console.log("Quote: ", quote)

            if (!connectWallet.state.address) {
                return;
            }

            // const balance = await getBalance(connectWallet.state.address)
            // console.log("BAL:", balance)

            // const userPublicKey = await getNearPublicKeyFromLocalStorage({ connectedAddress: connectWallet.state.address });

            // console.log("Public Key:", userPublicKey)

            // if (userPublicKey === null) {
            //     return;
            // }

            // // Add public key if needed
            // const res = await connectWallet.sendTransaction({
            //     id: ChainType.Near,
            //     tx: [
            //         {
            //             receiverId: "intents.near",
            //             actions: [
            //                 {
            //                     type: "FunctionCall",
            //                     params: {
            //                         methodName: "add_public_key",
            //                         args: { public_key: userPublicKey },
            //                         gas: "200000000000000",
            //                         deposit: "1",
            //                     },
            //                 },
            //             ],
            //         },
            //     ],
            // });

            // console.log("Res:", res)

            const standard = "nep413";
            const message = {
                signer_id: connectWallet.state.address,
                deadline: quote["expiration_time"],
                intents: [
                    {
                        intent: "token_diff",
                        diff: {
                            [quote["defuse_asset_identifier_in"]]: `-${quote["amount_in"]}`,
                            [quote["defuse_asset_identifier_out"]]: `${quote["amount_out"]}`,
                        },
                    },
                ],
            };

            const messageStr = JSON.stringify(message);
            const nonce = await generateNonce(connectWallet.state.address);
            const recipient = "intents.near";
            const intent = serializeIntent(messageStr, recipient, nonce.toString("base64"), standard);
            const res = await nearWalletConnect.signMessage({ message: messageStr, nonce, recipient: recipient });

            console.log("RES", res)

            const signatureBase58 = bs58.encode(Buffer.from(res.signatureData.signature, "base64"))
            const signedData = {
                standard,
                payload: {
                    message: res.signedData.message,
                    nonce: base64.encode(res.signedData.nonce),
                    recipient: res.signedData.recipient,
                    callbackUrl: res.signedData.callbackUrl,
                },
                signature: transformNEP141Signature(res.signatureData.signature),
                public_key: res.signatureData.publicKey,
            };

            console.log("Signed Data:", signedData);

            // console.log("Message sent to sign:", messageStr);
            // console.log("Nonce (base64):", nonce.toString("base64"));
            // console.log("Recipient:", recipient);
            // console.log("Signature (base58):", signatureBase58);
            // console.log("Public Key used:", res.signatureData.publicKey);
            // console.log("SignedData payload:", JSON.stringify(signedData, null, 2));

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
                                quote_hashes: [quote.quote_hash],
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
        } catch (err) {
            console.error(err);
            setResult("Swap failed.");
        } finally {
            setLoading(false);
        }
    };

    const swap = async () => {
        await swapToken({assetInput: "ZEC", amountInput: "0.0006", assetOutput: "wNEAR" });
    }

    const {fetchBridgeHistory, fetchSwapHistory} = useTransactionsHook();

    const params: SignAndSendTransactionsParams = {
        transactions: [
            {
                signerId: connectWallet.state.address,
                receiverId: "intents.near",
                actions: [
                    {
                        type: "FunctionCall",
                        params: {
                            methodName: "mt_transfer",
                            args: {
                                receiver_id: "zec-intents.near",
                                token_id: "nep141:zec.omft.near",
                                amount: "100000",
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
    

    const handleTransfer = async () => {
        const res = await fetchSwapHistory();
        // const res = await nearWalletConnect.signAndSendTransactions(params);
        console.log("Transfer RES:", res)
    }

    return (
        <div className="p-4 flex flex-col gap-4">
            <h1 className="text-xl font-bold">Test NEAR Swap via Intents</h1>
            {/* <button onClick={handleSwap} disabled={loading}>
                {loading ? "Processing Swap..." : "Swap Tokens"}
            </button>
            <button onClick={swap}>Status</button> */}
            {/* {result && <pre className="mt-4 whitespace-pre-wrap">{result}</pre>} */}
            <button onClick={handleTransfer}>Transfer to Contract</button>
        </div>
    );
}

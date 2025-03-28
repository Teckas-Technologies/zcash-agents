"use client";

import { useConnectWallet , ChainType} from "@/hooks/useConnectWallet"; // adjust import based on your structure
import { useState } from "react";
import { getNearPublicKeyFromLocalStorage, transformNEP141Signature, transformSolanaSignature, uint8ArrayToJson } from "@/utils/myUtils";
import { generateNonce, getBalance, serializeIntent, signMessage } from "@/utils/intentUtils";
import bs58 from "bs58";
import { useNearWalletActions } from "@/hooks/useNearWalletActions";
import { base64 } from "@scure/base";
import { fetchIntentStatus } from "@/utils/rpcUtils";
import { useWallet as useWalletSolana } from "@solana/wallet-adapter-react"
import { useWalletAgnosticSignMessage } from "@/hooks/useWalletAgnosticSignMessage";
import { WalletMessage } from "@/types/walletMessages";
import { publishIntent } from "@/services/tokensUsdPricesHttpClient/intentService";
// import { ChainType } from "@/types/deposit";
import { PublicKey } from "@solana/web3.js";


export default function SolSwapTestPage() {
    const connectWallet = useConnectWallet();
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);

    const status = async () => {
        const res = await fetchIntentStatus("4abrFkcj7sHEF5cYMKAsD7binPdGbjQZ9hQgPioEn2m6");
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
                        defuse_asset_identifier_in: "nep141:sol.omft.near",
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

    const solanaWallet = useWalletSolana();
    const signMessage = useWalletAgnosticSignMessage()

    const handleSwap = async () => {
        try {
            setLoading(true);

            // if (!connectWallet.state.address) {
            //     await connectWallet.signIn({ id: ChainType.Solana });
            // }

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

            // Add public key if needed
            const res = await connectWallet.sendTransaction({
                id: ChainType.Solana,
                tx: [
                    {
                        receiverId: "intents.near",
                        actions: [
                            {
                                type: "FunctionCall",
                                params: {
                                    methodName: "add_public_key",
                                    args: { public_key: `ed25519:${connectWallet.state.address}` },
                                    gas: "200000000000000",
                                    deposit: "1",
                                },
                            },
                        ],
                    },
                ],
            });

            // console.log("Res:", res)
            console.log("Step1")
            // const nonce = await generateNonce(connectWallet.state.address);

            const publicKey = new PublicKey(connectWallet.state.address)
            console.log("Publickey:", publicKey)
            console.log("Recovered Public Key:", publicKey.toString());

            const standard = "nep413";
            console.log("Step2")
            const message = {
                signer_id: publicKey,
                verifying_contract: "intents.near",
                deadline: quote["expiration_time"],
                nonce: "+tjxIFLVmtl/chlMbjrA5xJ2kxm/4LusF+GQbsXne7Y=", // nonce.toString("base64"),
                intents: [
                    {
                        intent: "token_diff",
                        diff: {
                            [quote["defuse_asset_identifier_in"]]: `-${quote["amount_in"]}`,
                            [quote["defuse_asset_identifier_out"]]: `${quote["amount_out"]}`,
                        },
                        referral: "near-intents.intents-referral.near"
                    },
                ],
            };
            console.log("Step1")
            // Convert the message to JSON string
            const messageJson = JSON.stringify(message);

            console.log("Message:", messageJson)

            // Convert the JSON string to a Uint8Array
            const messageUint8Array = new TextEncoder().encode(messageJson);

            console.log("messageUint8Array:", messageUint8Array)

            // const messageJsonString = new TextDecoder().decode(messageUint8Array);
            // const messageObject = JSON.parse(messageJsonString);

            // console.log("Message Object:", messageObject);

            const walletMessage = {
                ERC191: {
                    message: "Hello from Ethereum!"
                },
                NEP413: {
                    message: "Hello from NEAR!",
                    nonce: Buffer.from("someNonce"),
                    recipient: "intents.near"
                },
                SOLANA: {
                    message: messageUint8Array,
                },
                WEBAUTHN: {
                    challenge: messageUint8Array,
                    payload: "payloadData", // Add payload (string or any data structure you need)
                    parsedPayload: JSON.parse('{"someKey": "someValue"}') // Example parsedPayload (object)
                }
            }

            const result: any = await signMessage(walletMessage)

            console.log("RES", result)

            // const userInfo = {
            //     userAddress: `ed25519:${connectWallet.state.address}`,
            //     userChainType: ChainType.Solana
            // }
            // const res = await publishIntent(result, userInfo, [quote.quote_hash]);
            // console.log("RES:", res)


            // const signatureBase58 = bs58.encode(Buffer.from(res.signatureData.signature, "base64"))
            // const signedData = {
            //     standard: "raw_ed25519",
            //     payload: new TextDecoder().decode(result.signedData?.message),
            //     signature: transformSolanaSignature(result.signatureData as Uint8Array),
            //     public_key: `ed25519:${connectWallet.state.address}`,
            // };

            const signedData = {
                standard,
                payload: {
                    message: new TextDecoder().decode(result.signedData?.message),
                    nonce: "+tjxIFLVmtl/chlMbjrA5xJ2kxm/4LusF+GQbsXne7Y=",
                    recipient: "intents.near",
                },
                signature: transformNEP141Signature(result.signatureData.toString("base64")),
                public_key: `ed25519:${connectWallet.state.address}`,
            };

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

    return (
        <div className="p-4 flex flex-col gap-4">
            <h1 className="text-xl font-bold">Test NEAR Swap via Intents</h1>
            <button onClick={handleSwap} disabled={loading}>
                {loading ? "Processing Swap..." : "Swap Tokens"}
            </button>
            <button onClick={status}>Status</button>
            {result && <pre className="mt-4 whitespace-pre-wrap">{result}</pre>}
        </div>
    );
}

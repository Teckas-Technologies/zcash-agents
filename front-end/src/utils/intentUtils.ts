import { BorshSchema, borshSerialize } from "borsher";
import { createHash, randomBytes } from "crypto";
import {
    Account,
    providers,
    Connection,
    InMemorySigner,
    KeyPair,
    connect
} from "near-api-js";
import {
    INTENTS_CONTRACT_ID,
} from "./constants";
import { getNearPublicKeyFromLocalStorage } from "./myUtils";

const provider = new providers.JsonRpcProvider({
    url: "https://rpc.mainnet.near.org",
});


const connection = await connect({
    networkId: "mainnet",
    nodeUrl: "https://rpc.mainnet.near.org",
});


// const keyPair = KeyPair.fromString(ACCOUNT_PRIVATE_KEY);


async function isNonceUsed(nonce: string, accountId: string): Promise<boolean> {
    const account = await connection.account(accountId);

    return await account.viewFunction({
        contractId: INTENTS_CONTRACT_ID,
        methodName: "is_nonce_used",
        args: {
            account_id: account.accountId,
            nonce,
        },
    });
}


export async function getBalance(accountId: string, tokenAddress: string) {
    const account = await connection.account(accountId);

    return await account.viewFunction({
        contractId: INTENTS_CONTRACT_ID,
        methodName: "mt_batch_balance_of",
        args: {
            account_id: account.accountId,
            token_ids: [`nep141:${tokenAddress}`] // "nep141:eth.omft.near", "nep141:usdt.tether-token.near", "nep141:sol.omft.near", "nep141:eth-0xdac17f958d2ee523a2206206994597c13d831ec7.omft.near"
        },
    });
}

export async function generateNonce(accountId: string) {
    const randomArray = randomBytes(32);

    const nonceString = randomArray.toString("base64");

    if (await isNonceUsed(nonceString, accountId)) {
        //this step can be skipped but if nonce is already used quote wont be taken into account
        return generateNonce(accountId);
    } else {
        return randomArray;
    }
}

export async function storePublicKeyForSigVerification(accountId: string): Promise<void> {
    // const account = await getAccount();
    const account = await connection.account(accountId);
    // const publicKey = await account.connection.signer.getPublicKey(
    //     account.accountId,
    //     "mainnet"
    // );
    const publicKey = await getNearPublicKeyFromLocalStorage({ connectedAddress: accountId });

    const hasPublicKey = await account.viewFunction({
        contractId: INTENTS_CONTRACT_ID,
        methodName: "has_public_key",
        args: {
            account_id: account.accountId,
            public_key: publicKey.toString(),
        },
    });

    if (hasPublicKey === true) return;

    console.warn(
        `Registering public key ${publicKey.toString()} of account ${account.accountId
        } for signature verification`
    );

    await account.functionCall({
        contractId: INTENTS_CONTRACT_ID,
        methodName: "add_public_key",
        args: {
            public_key: publicKey.toString(),
        },
        attachedDeposit: BigInt(1),
    });
}

// export async function signMessage(message: Uint8Array, accountId: string) {
//     const account = await connection.account(accountId);
//     return keyPair.sign(message);
// }

export interface SignMessageParams {
    message: string;
    recipient: string;
    nonce: Buffer;
    callbackUrl?: string;
    state?: string;
}

export async function signMessage(message: Uint8Array, accountId: string) {
    // const account = await connection.account(accountId);
    // const signer = account.connection.signer;

    // console.log("Account: ", account)
    // console.log("Signer: ", signer)

    // const publicKey = await signer.getPublicKey(accountId, "mainnet");

    // const signature = await signer.signMessage(message, accountId, "mainnet");

    // console.log("publicKey: ", publicKey)
    // console.log("signature: ", signature)

    // return {
    //     signature: signature.signature, // Uint8Array signature
    //     publicKey: publicKey.toString(),
    // };
}


const standardNumber = {
    ["nep413"]: 413,
};

const Nep413PayloadSchema = BorshSchema.Struct({
    message: BorshSchema.String,
    nonce: BorshSchema.Array(BorshSchema.u8, 32),
    recipient: BorshSchema.String,
    callback_url: BorshSchema.Option(BorshSchema.String),
});

export function serializeIntent(
    intentMessage: any,
    recipient: string,
    nonce: string,
    standard: "nep413"
): Buffer {
    const payload = {
        message: intentMessage,
        nonce: base64ToUint8Array(nonce),
        recipient,
    };
    const payloadSerialized = borshSerialize(Nep413PayloadSchema, payload);
    console.log("Payload:", payloadSerialized)
    const baseInt = 2 ** 31 + standardNumber[standard];
    const baseIntSerialized = borshSerialize(BorshSchema.u32, baseInt);
    const combinedData = Buffer.concat([baseIntSerialized, payloadSerialized]);
    return createHash("sha256").update(combinedData).digest();
}

const base64ToUint8Array = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};
import { base58, base64 } from "@scure/base";


export const getNearPublicKeyFromLocalStorage = ({ connectedAddress }: { connectedAddress: string }) => {
    const authKey = localStorage.getItem("near_app_wallet_auth_key");
    if (authKey) {
        const parsed = JSON.parse(authKey);
        if (parsed.accountId = connectedAddress) {
            return parsed.allKeys?.[0];
        } else {
            return null;
        }
    }
    return null;
};

export function transformNEP141Signature(signature: string) {
    const encoded = base58.encode(base64.decode(signature))
    return `ed25519:${encoded}`
}

export function transformSolanaSignature(signature: Uint8Array) {
    return `ed25519:${base58.encode(signature)}`
}

export function uint8ArrayToJson(uint8Array: Uint8Array): object {
    // Decode the Uint8Array to a string (assuming it's UTF-8 encoded)
    const decodedString = new TextDecoder().decode(uint8Array);

    // Parse the string into a JSON object
    const jsonObject = JSON.parse(decodedString);

    return jsonObject;
}

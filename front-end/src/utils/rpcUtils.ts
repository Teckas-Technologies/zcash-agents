const RPC_URL = "https://solver-relay-v2.chaindefuser.com/rpc";
const TOKENS_URL = "https://api-mng-console.chaindefuser.com/api/tokens";


export async function fetchQuote(
    assetInput: string,
    amountInput: string,
    assetOutput: string
): Promise<any | undefined> {
    const body = {
        id: "dontcare",
        jsonrpc: "2.0",
        method: "quote",
        params: [
            {
                defuse_asset_identifier_in: assetInput.includes("nep141:") ? assetInput : `nep141:${assetInput}`,
                defuse_asset_identifier_out: assetOutput.includes("nep141:") ? assetOutput : `nep141:${assetOutput}`,
                exact_amount_in: amountInput,
                min_deadline_ms: 60000,
            },
        ],
    };

    const response = await fetch(RPC_URL, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json",
        },
    });

    const json: any = await response.json();

    if (!response.ok) {
        throw new Error(
            `Request failed ${response.status} ${response.statusText
            } - ${JSON.stringify(json)}`
        );
    }

    const result = json.result;

    console.log("Result JSON:", json)

    if (result === null) return undefined;

    return result.at(0);
}

export async function publishIntent(
    quoteHash: string,
    signedData: any
): Promise<any | undefined> {
    const body = {
        id: "dontcare",
        jsonrpc: "2.0",
        method: "publish_intent",
        params: [
            {
                quote_hashes: [quoteHash],
                signed_data: signedData,
            },
        ],
    };

    const response = await fetch(RPC_URL, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json",
        },
    });

    const json: any = await response.json();

    if (!response.ok) {
        throw new Error(
            `Request failed ${response.status} ${response.statusText
            } - ${JSON.stringify(json)}`
        );
    }

    const result = json.result;

    return result || undefined;
}

export async function fetchIntentStatus(
    intentHash: string
): Promise<any | undefined> {
    const body = {
        id: "dontcare",
        jsonrpc: "2.0",
        method: "get_status",
        params: [
            {
                intent_hash: intentHash,
            },
        ],
    };

    const response = await fetch(RPC_URL, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json",
        },
    });

    const json: any = await response.json();

    if (!response.ok) {
        throw new Error(
            `Request failed ${response.status} ${response.statusText
            } - ${JSON.stringify(json)}`
        );
    }

    const result = json.result;

    return result || undefined;
}

export async function fetchTokens(): Promise<any | undefined> {
    const response = await fetch(TOKENS_URL);

    const json: any = await response.json();

    if (!response.ok) {
        throw new Error(
            `Request failed ${response.status} ${response.statusText
            } - ${JSON.stringify(json)}`
        );
    }

    // If there are tokens in the response, return them; otherwise, return undefined
    return json.items || undefined;
}
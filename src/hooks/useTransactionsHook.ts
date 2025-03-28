import { useState } from 'react';
import { useConnectWallet } from './useConnectWallet';
import { PYTHON_SERVER_URL } from '@/constants';

interface RequestFields {
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    txHash: string;
}

export const useTransactionsHook = () => {
    const { state } = useConnectWallet();
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBridgeHistory = async () => {
        try {
            if (!state.address) {
                throw new Error("Please connect your NEAR wallet.");
            }
            setLoading(true);
            setError(null);

            const response = await fetch(`https://bridge.chaindefuser.com/rpc`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: "dontcare",
                    jsonrpc: "2.0",
                    method: "recent_deposits",
                    params: [{
                        "account_id": state.address
                    }]
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            return { success: true, data: result?.result?.deposits };
        } catch (err: any) {
            setError(err.message || "An error occurred");
            return { success: false, message: err.message || "An error occurred" };
        } finally {
            setLoading(false);
        }
    };

    const addSwapHistory = async (data: RequestFields) => {
        try {
            if (!state.address) {
                throw new Error("Please connect your NEAR wallet.");
            }
            setLoading(true);
            setError(null);

            const response = await fetch(`https://zec-intents-ai-cmanegh4dkcgfage.canadacentral-01.azurewebsites.net/api/swap_details`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from_token: data.fromToken,
                    to_token: data.toToken,
                    from_amount: data.fromAmount,
                    to_amount: data.toAmount,
                    wallet_address: state.address,
                    tx_hash: data.txHash
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            return { success: true, data: result };
        } catch (err: any) {
            setError(err.message || "An error occurred");
            return { success: false, message: err.message || "An error occurred" };
        } finally {
            setLoading(false);
        }
    };

    const fetchSwapHistory = async () => {
        if (!state.address) {
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`${PYTHON_SERVER_URL}/api/swap_details/${state.address}`, {
                method: "GET"
            })
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
            const result = await response.json();
            console.log("Result:", result)
            return result;
        } catch (err: any) {
            console.error("Error occurred:", err);
            setError(err?.message || "Something went wrong");
        } finally {
            setLoading(false);
            console.log("Loading state set to false");
        }
    }


    return { loading, error, fetchBridgeHistory, addSwapHistory, fetchSwapHistory };
};
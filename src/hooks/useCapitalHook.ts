import { useState } from 'react';
import { useConnectWallet } from './useConnectWallet';
import { Asset } from './useInvestZec';

interface RequestFields {
    capitalId: string;
    tokensToBuy: Asset[];
    amount: string;
}

export const useCapitalHook = () => {
    const { state } = useConnectWallet();
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const createCapital = async (data: RequestFields) => {
        try {
            if (!state.address) {
                throw new Error("Please connect your NEAR wallet.");
            }
            setLoading(true);
            setError(null);

            const response = await fetch('https://zec-intents-ai-cmanegh4dkcgfage.canadacentral-01.azurewebsites.net/api/create-capital', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    capital_id: data.capitalId,
                    tokens_to_buy: data.tokensToBuy,
                    receiver_id: state.address,
                    total_zec: data.amount
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

    return { loading, error, createCapital };
};
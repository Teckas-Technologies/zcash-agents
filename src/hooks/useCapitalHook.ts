import { useState } from 'react';
import { useConnectWallet } from './useConnectWallet';
import { Asset } from './useInvestZec';
import { PYTHON_SERVER_URL } from '@/constants';

interface RequestFields {
    depositHash: string;
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

            const response = await fetch(`${PYTHON_SERVER_URL}/api/create-capital`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    deposit_hash: data.depositHash,
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

    const closePosition = async ({ capitalId }: { capitalId: string }) => {
        try {
            if (!state.address) {
                throw new Error("Please connect your NEAR wallet.");
            }
            setLoading(true);
            setError(null);

            const response = await fetch(`${PYTHON_SERVER_URL}/api/capital/close-position/${capitalId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
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

    return { loading, error, createCapital, closePosition };
};
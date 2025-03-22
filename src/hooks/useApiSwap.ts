
import { useState } from "react";


export const useApiSwapToken = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);


    const swapToken = async () => {

        try {
            setLoading(true);
            setError(null);

            return { success: true, message: `Swap executed successfully!` }
        } catch (err: any) {
            console.error("Error swapping token:", err);
            setError("Transaction failed. Please try again.");
            return { success: false, message: err.message || "An error occurred" };
        } finally {
            setLoading(false);
        }
    };

    return { loading, error, swapToken };
};

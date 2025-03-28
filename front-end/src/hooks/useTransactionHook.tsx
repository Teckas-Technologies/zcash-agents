import { useState, useEffect } from "react";
import { useConnectWallet } from "./useConnectWallet";

type Transaction = {
  _id: string;
  receiver_id: string;
  tokens_to_buy: { symbol: string; share: number }[];
  total_zec: number;
  deposit_hash: string;
};

const useTransaction = () => {
  const { state } = useConnectWallet();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!state.address) {
    return;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_URL = `https://zec-intents-ai-cmanegh4dkcgfage.canadacentral-01.azurewebsites.net/api/capital?receiver_id=${state.address}`;

        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        const result: any[] = await response.json(); // Explicitly define type
        console.log("result --", result);

        setData(result);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};

export default useTransaction;

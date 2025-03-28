import { useState, useEffect } from "react";

type Transaction = {
  _id: string;
  receiver_id: string;
  tokens_to_buy: { symbol: string; share: number }[];
  total_zec: number;
  deposit_hash: string;
};

const API_URL =
  "https://zec-intents-ai-cmanegh4dkcgfage.canadacentral-01.azurewebsites.net/api/capital?receiver_id=mosaic-vint.near";

const useTransaction = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        const result: Transaction[] = await response.json(); // Explicitly define type
        console.log("result --",result);
        
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

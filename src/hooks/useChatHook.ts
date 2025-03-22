import { useState } from 'react';

interface RequestFields {
    inputMessage: string;
    agentName: string;
}

export const useChat = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);


    const chat = async (data: RequestFields) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('https://sonic-agents-c3gwbpgtdzcffte5.canadacentral-01.azurewebsites.net/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    agentName: data.agentName, // "bridgeAgent"
                    message: data.inputMessage,
                    threadId: data.agentName,  // agent id
                    userId: "connected-address",
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

    const fetchAgents = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`https://sonic-agents-c3gwbpgtdzcffte5.canadacentral-01.azurewebsites.net/api/list-agents`, {
                method: "GET",
                // headers: {
                //     "Content-Type": "application/json",
                //     Authorization: `Bearer ${token}`,
                // },
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }

            const result = await response.json();
            return result;
        } catch (err: any) {
            console.error("Error occurred:", err);
            setError(err.message || "Something went wrong");
            return [];
        } finally {
            setLoading(false);
        }
    }

    const fetchChatHistory = async (agentName: string) => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`https://sonic-agents-c3gwbpgtdzcffte5.canadacentral-01.azurewebsites.net/api/history/${"connected-address"}/${agentName}`, {
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

    const clearHistory = async (agentName: string) => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`https://sonic-agents-c3gwbpgtdzcffte5.canadacentral-01.azurewebsites.net/api/history/${"connected-address"}/${agentName}`, {
                method: "DELETE"
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

    return { loading, error, chat, fetchChatHistory, clearHistory, fetchAgents };
};

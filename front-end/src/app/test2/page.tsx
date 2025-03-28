"use client";

import { useEffect, useState } from "react";

export default function TestPage2() {
    const [isConnected, setIsConnected] = useState(false);

    const bridgeTokens = async () => {

    }

    return (
        <div className="w-full h-full bg-red-50">
            <div className="header w-full bg-black h-[6rem] flex items-center justify-between px-[4rem]">
                <h2 className="text-white">Sonic Agents</h2>
                <div className="btns flex items-center gap-4">
                    {isConnected && <h4 className="text-white"></h4>}
                    {!isConnected && <button className="px-6 py-2 rounded-md bg-green-300 text-white">Connect Wallet</button>}
                    {isConnected && <button className="px-6 py-2 rounded-md bg-red-300 text-white">Disconnect</button>}
                </div>
            </div>

            <div className="main w-full h-full p-6">
                <button onClick={bridgeTokens} className="px-6 py-2 rounded-md bg-blue-500 text-white">
                    Bridge 0.1 SOL to Sonic
                </button>
            </div>
        </div>
    );
}

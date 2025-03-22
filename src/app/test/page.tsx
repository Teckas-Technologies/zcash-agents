"use client";

import ConnectWallet from "@/Components/Wallet";
import { FeatureFlagsContext } from "@/providers/FeatureFlagsProvider";
import { useContext, useEffect, useState } from "react";
import AddTurboChainButton from "@/Components/AddTurboChainButton"

export default function TestPage() {
    const [isConnected, setIsConnected] = useState(false);
    const { whitelabelTemplate } = useContext(FeatureFlagsContext)

    const handleBridge = async () => {

    }


    return (
        <div className="w-full h-full bg-red-50">
            <div className="header w-full h-[6rem] flex items-center justify-between px-[4rem]">
                <h2 className="text-white">Sonic Agents</h2>
                <div className="btns flex items-center gap-4">
                    {isConnected && <h4 className="text-white">{ }</h4>}
                    {/* {!isConnected && <button className="px-6 py-2 rounded-md bg-green-300 text-white" >Connect Wallet</button>} */}
                    {whitelabelTemplate === "turboswap" && (
                        <div className="hidden md:block">
                            <AddTurboChainButton />
                        </div>
                    )}
                    <ConnectWallet />
                    {/* {isConnected && <button className="px-6 py-2 rounded-md bg-red-300 text-white">Disconnect</button>} */}
                </div>
            </div>

            <div className="main w-full h-full p-6">
                <button onClick={handleBridge} className="px-6 py-2 rounded-md bg-blue-500 text-white">
                    Swap 0.1 SOL to Sonic
                </button>
            </div>
        </div>
    );
}

import React, { useEffect, useRef } from "react";
import { IoMdInformationCircleOutline } from "react-icons/io";

export default function AgentsModal({
  isOpen,
  onClose,
  setActiveAgent,
  sonicAgents
}: {
  isOpen: boolean;
  onClose: () => void;
  setActiveAgent: (name: string) => void;
  sonicAgents: string[]
}) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose(); // Close the modal
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const agents = [
    {
      name: "CoinGecko Agent",
      description:
        "CoinGecko Agent is an AI helper with full access to CoinGecko's Public API.",
      icon: "images/sonic-logo.png",
    },
    {
      name: "Ref Finance Agent",
      description:
        "An assistant that provides token metadata and swaps tokens through Ref Finance.",
      icon: "images/sonic-logo.png",
    },
    {
      name: "GrowthMate Discovery",
      description:
        "Discover the ecosystem through relevant activities, news, and offers with GrowthMate.",
      icon: "images/sonic-logo.png",
    },
  ];

  return (
    <div className="fixed inset-0 flex items-end justify-center bg-white bg-opacity-50">
      <div
        ref={modalRef}
        className="w-full agents-box shadow chess-div text-white p-5 rounded-t-lg shadow-lg max-w-md"
      >
        {/* Header */}
        <div className=" agents-box bg-white rounded p-3">
          <h2 className="text-lg font-bold text-[#21201C]" style={{ fontFamily: "orbitron" }}>
            Agents
          </h2>
          <p className="text-sm text-gray-400" style={{ fontFamily: "manrope" }}>
            Choose agents to perform specific tasks.
          </p>

          {/* Search Bar */}
          <div className="relative mt-3">
            <input
              type="text"
              placeholder="Search"
              className="w-full p-2 pl-4 bg-[#F1F0EF] text-[#21201C] rounded placeholder-gray-400 focus:outline-none"
            />
          </div>

          {/* Agents List */}
          <div className="mt-4 space-y-3 max-h-60 overflow-y-auto" style={{ fontFamily: "manrope" }}>
            {sonicAgents?.length > 0 && sonicAgents.map((agent, index) => (
              <div
                key={index}
                className="p-3 agents-box bg-white shadow rounded-md cursor-pointer hover:bg-gray-700 transition-all"
                onClick={() => {
                  setActiveAgent(agent);
                  onClose(); // Close modal after selection
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="logo w-7 h-7 p-1 bg-[#21201C] rounded-md">
                      <img
                        src="/icons/network/near.svg"
                        alt={`${agent} logo`}
                        className="h-5 w-5"
                      />
                    </div>
                    <h3 className="font-semibold text-sm truncate-1-lines text-[#21201C]">
                      {/* {agent.name.length > 25 ? agent.name.slice(0, 25) + "..." : agent.name} */}
                      {agent === "zecIntentAgent" ?
                        "Zec Intent Assistant" :
                        "Swap Assistant"}
                    </h3>
                  </div>
                  <IoMdInformationCircleOutline className="w-5 h-5 text-gray-400" />
                </div>

                {/* Description */}
                <p className="text-xs text-gray-400 mt-1">
                  {agent === "zecIntentAgent" ?
                    "Assistant for helping users to trade by $zec through simple chat" :
                    "Assistant for helping users to swap tokens by near intents in all chains."}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full bg-white agents-box shadow text-[#21201C] py-2 rounded mt-3"
          style={{ fontFamily: "manrope" }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

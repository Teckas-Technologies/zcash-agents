/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";
import InlineSVG from "react-inlinesvg";
import "./Agents.css";
import { FaSearch } from "react-icons/fa";
import { MdKeyboardArrowRight, MdKeyboardArrowDown } from "react-icons/md";
import { useChat } from "@/hooks/useChatHook";
import { useRouter } from "next/navigation";

const agents = [
  {
    name: "Bitte Assistant",
    description:
      "General Bitte DEFI assistant, generate evm and near swaps and get market information",
    author: "bitte.near",
    verified: true,
    logo: "images/sonic-logo.png",
  },
  {
    name: "Bitte Assistant",
    description:
      "General Bitte DEFI assistant, generate evm and near swaps and get market information",
    author: "bitte.near",
    verified: true,
    logo: "images/sonic-logo.png",
  },
  {
    name: "Bitte Assistant",
    description:
      "General Bitte DEFI assistant, generate evm and near swaps and get market information",
    author: "bitte.near",
    verified: true,
    logo: "images/sonic-logo.png",
  },
  {
    name: "CoWSwap Assistant",
    description:
      "An assistant that generates EVM transaction data for CoW Protocol Interactions",
    author: "max-normal.near",
    verified: true,
    logo: "images/sonic-logo.png",
  },
  {
    name: "Meme.cooking",
    description:
      "It helps users create memecoins and retrieve memecoin information like daily stats and specific details",
    author: "rub3n.near",
    verified: true,
    logo: "images/sonic-logo.png",
  },
  {
    name: "CoinGecko Agent",
    description:
      "CoinGecko Agent is an AI helper with full access to CoinGecko's API. It provides real-time cryptocurrency data.",
    author: "markeljan.near",
    verified: true,
    category: "Investing",
    logo: "images/sonic-logo.png",
  },
];

const categories = ["Investing", "DAO", "Computational", "DeFi"];

const Agents = ({
  onToggle,
  onMobileNavToggle,
  isMobileNavVisible,
}: {
  onToggle: () => void;
  onMobileNavToggle: () => void;
  isMobileNavVisible: boolean;
}) => {
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["DeFi"]);
  const [agents, setAgents] = useState([]);
  const router = useRouter();
  const { fetchAgents } = useChat();

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category]
    );
  };

  useEffect(() => {
    fetchSonicAgents();
  }, [])

  const fetchSonicAgents = async () => {
    const res = await fetchAgents();
    setAgents(res.agents);
  }

  return (
    <div className="flex flex-col h-screen chess-div text-white overflow-hidden">
      {isMobileNavVisible && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm z-30 md:hidden"
          onClick={onMobileNavToggle}
        />
      )}
      <div
        className="top-nav bg-white p-4 flex items-center md:gap-5 gap-3 w-full"
        style={{ fontFamily: "orbitron" }}
      >
        <button
          onClick={() => {
            onToggle(); // Always toggle collapse state
            if (window.innerWidth < 768) {
              onMobileNavToggle(); // Only toggle mobile nav visibility on mobile screens
            }
          }}
          className="focus:outline-none"
        >
          <InlineSVG
            src="icons/Toggle.svg"
            className="w-5 h-5 cursor-pointer text-[#21201C]"
          />
        </button>
        <div className="text-lg text-[#21201C] font-semibold">CHAT</div>
        <MdKeyboardArrowRight className="w-6 h-6 text-[#21201C]" />
        <div className="text-gray-400 text-xs">VEJAS6QK0U1BTPQK</div>
      </div>

      {/* Layout with Sidebar & Main Content */}
      <div className="flex flex-col md:flex-row flex-grow h-screen">
        {/* Sidebar - Fixed, No Scroll */}
        <div className="md:w-1/4 w-full md:p-6 p-3">
          {/* Category Dropdown */}
          <div className="mt-6" style={{ fontFamily: "manrope" }}>
            <div
              className="flex items-center cursor-pointer"
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            >
              <MdKeyboardArrowRight
                size={18}
                className={`mr-2 text-[#21201C] transition-transform ${isCategoryOpen ? "rotate-90" : "rotate-0"
                  }`}
              />
              <h3
                className="text-md font-semibold text-[#21201C]"
                style={{ fontFamily: "orbitron" }}
              >
                Category
              </h3>
            </div>

            {isCategoryOpen && (
              <div
                className="mt-2 flex flex-col gap-2"
                style={{ fontFamily: "manrope" }}
              >
                {categories.map((category) => (
                  <label
                    key={category}
                    className="flex items-center bg-white agents-box shadow text-[#21201C] px-4 py-3 rounded-lg cursor-pointer transition"
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={selectedCategories.includes(category)}
                      onChange={() => toggleCategory(category)}
                    />
                    <span
                      className={`w-5 h-5 flex items-center justify-center border-2 border-white rounded ${selectedCategories.includes(category)
                        ? "bg-[#F1F0EF] text-[#21201C]"
                        : "bg-[#F1F0EF]"
                        }`}
                    >
                      {selectedCategories.includes(category) && "✔"}
                    </span>
                    <span className="ml-2">{category}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Scrollable */}
        <div className="md:w-3/4 w-full p-6 overflow-y-auto h-screen">
          {/* Search Bar */}
          <div className="mb-6 flex justify-start relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="w-full md:w-1/2 p-3 pl-10 bg-[#F1F0EF] text-[#21201C] agents-box rounded-lg"
              style={{ outline: "none", boxShadow: "none" }}
            />
          </div>

          {/* Agents Grid - Scrollable */}
          <div className="grid md:grid-cols-2 grid-cols-1 gap-6 mb-[100px]">
            {selectedCategories.includes("DeFi") && agents.length > 0 && agents?.map((agent, index) => (
              <div key={index} className="common cursor-pointer">
                <div
                  className="p-6 bg-white agents-box shadow rounded-lg 
                hover:border-b hover:border-gray-500 
                transition-all duration-300 ease-in-out"
                >
                  {/* Logo, Title, and Button in the Same Line */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {agent && (
                        <div className="logo w-8 h-8 p-1 bg-[#21201C] rounded-md">
                          <img
                            src="/icons/network/near.svg"
                            alt={`${agent} logo`}
                            className="h-6 w-6"
                          />
                        </div>
                      )}
                      <h5
                        className="text-base font-semibold truncate-1-lines text-[#21201C]"
                        style={{ fontFamily: "orbitron" }}
                      >
                        {agent === "bridgeAgent" ?
                          "Bridge Assistant" :
                          agent === "swapAgent" ?
                            "Swap Assistant" :
                            agent === "tradeAgent" ?
                              "Trade Assistant" :
                              "Zec Intent Assistant"}
                      </h5>
                    </div>
                    <button
                      className="py-2 px-3 bg-[#21201C] hover:bg-gray-600 cursor-pointer rounded text-sm"
                      style={{ fontFamily: "manrope" }}
                      onClick={() => router.push(`/?agent=${agent}`)}
                    >
                      Run Agent
                    </button>
                  </div>

                  {/* Description */}
                  <p
                    className="text-sm text-gray-400 truncate-2-lines"
                    style={{
                      fontFamily: "manrope",
                      maxWidth: "calc(100% - 1rem)",
                    }}
                  >
                    {agent === "bridgeAgent" ?
                      "Assistant for helping users to bridge tokens between Zcash & Near Intents." :
                      agent === "swapAgent" ?
                        "Assistant for helping users to swap tokens in the Near Intents by ZEC tokens." :
                        agent === "tradeAgent" ?
                          "Assistant for helping users to invest and trading on near intents by ZEC tokens. It will invest ZEC tokens in the top-picked momentum crypto tokens from the last 24 hours." :
                          "Assistant for helping users to trade, bridge & swap tokens, fetch balance and withdraw ZEC tokens to Zcash network."}
                  </p>

                  {/* Author and Verification */}
                  <div className="mt-4 flex items-center justify-between">
                    {/* Author Section */}
                    <div
                      className="flex items-center gap-2"
                      style={{ fontFamily: "manrope" }}
                    >
                      <span className="text-gray-500 text-sm">By</span>
                      <img
                        src="/images/teckas.png"
                        alt="Author Logo"
                        className="w-5 h-5 rounded-full"
                      />
                      <span className="text-gray-500 text-sm">
                        {"Teckas"} {/** agent.author */}
                      </span>
                    </div>

                    {/* Verified Badge agent.verified */}
                    {true && (
                      <span
                        className="px-3 flex flex-row items-center justify-center gap-1 py-1 text-xs text-green-500 border border-green-500 rounded-2xl"
                        style={{ fontFamily: "manrope" }}
                      >
                        <InlineSVG
                          src="icons/green-tick.svg"
                          className="w-3 h-3"
                        />{" "}
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {!selectedCategories.includes("DeFi") && selectedCategories.length !== 0 && <div className="w-full flex flex-col items-center justify-center gap-3">
            <p className="text-[#21201C]" style={{ fontFamily: "orbitron" }}>Agents will come soon!</p>
            <div className="soon px-2 py-1 bg-[#F76B15] rounded text-white md:text-sm text-[8px] font-semibold"
              style={{ fontFamily: "orbitron" }}>
              SOON
            </div>
          </div>}
          {selectedCategories.length === 0 && <div className="w-full flex flex-col items-center justify-center gap-3">
            <p className="text-[#21201C]" style={{ fontFamily: "orbitron" }}>No agents found!</p>
          </div>}
        </div>
      </div>
    </div>
  );
};

export default Agents;

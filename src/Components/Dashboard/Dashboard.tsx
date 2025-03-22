"use client";
import { useEffect, useRef, useState } from "react";
import InlineSVG from "react-inlinesvg";
import { BiUpArrowAlt } from "react-icons/bi";
import { MdKeyboardArrowRight } from "react-icons/md";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { FaSearch } from "react-icons/fa";
import AgentsModal from "../AgentsModal/AgentsModal";
import { useChat } from "@/hooks/useChatHook";
import dynamic from "next/dynamic";
import { useApiSwapToken } from "@/hooks/useApiSwap";
import "./Dashboard.css"
import ConnectWallet from "../Wallet";
import { useConnectWallet } from "@/hooks/useConnectWallet";

const MarkdownToJSX = dynamic(() => import("markdown-to-jsx"), { ssr: false });

const agents = [
  {
    name: "Delta Trade DCA Helper",
    description: "Automate your Dollar-Cost Averaging (DCA) strategy with precision. This agent helps you execute scheduled trades at optimal intervals, reducing market volatility impact.",
    logo: "images/sonic-logo.png",
  },
  {
    name: "PotLock-Assistant",
    description: "A secure and efficient assistant for managing locked liquidity pools. It ensures smooth handling of fund releases, withdrawals, and re-locking based on predefined conditions.",
    logo: "images/sonic-logo.png",
  },
  {
    name: "Bitte Distribute Tokens",
    description: "Effortlessly distribute tokens to multiple recipients in a single transaction. This agent streamlines batch token transfers, saving time and gas fees.",
    logo: "images/sonic-logo.png",
  },
  {
    name: "Bitte WETH Wraptor",
    description: "Easily wrap and unwrap ETH into WETH for seamless DeFi interactions. This agent simplifies token conversions, ensuring efficient trading and liquidity provision.",
    logo: "images/sonic-logo.png",
  },
];

interface Message {
  role: "ai" | "human",
  message: string;
  txHash?: string;
  fromChain?: "solanamainnet" | "sonicsvm";
}

const dummymessages: Message[] = [
  { role: "ai", message: "Hello, how can I assist you?" },
  { role: "human", message: "What is your name?" },
  { role: "ai", message: "I'm an AI assistant, you can call me ChatGPT!" },
  { role: "human", message: "Can you tell me a joke?" },
  { role: "ai", message: "Sure! Why don’t skeletons fight each other? Because they don’t have the guts!" },
  { role: "human", message: "What's the weather like today?" },
  { role: "ai", message: "I'm not connected to live data, but you can check a weather website for the latest update!" },
  { role: "human", message: "Can you suggest a good book to read?" },
  { role: "ai", message: "Of course! If you like fiction, 'The Alchemist' by Paulo Coelho is a great choice!" },
  { role: "human", message: "What is the capital of Japan?" },
  { role: "ai", message: "The capital of Japan is Tokyo!" }
];

export default function Dashboard({
  onToggle,
  onMobileNavToggle,
}: {
  onToggle: () => void;
  onMobileNavToggle: () => void;
}) {
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { state, signIn, connectors } = useConnectWallet();
  const { swapToken } = useApiSwapToken();
  const { chat, fetchChatHistory, clearHistory, fetchAgents } = useChat();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [agents, setAgents] = useState([]);
  const [isBridging, setIsBridging] = useState(false);
  const [isSwaping, setIsSwaping] = useState(false);

  useEffect(() => {
    // Scroll to bottom when messages update
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryAgent = params.get("agent");
      if (queryAgent) {
        setActiveAgent(queryAgent);
      } else {
        setActiveAgent("bridgeAgent")
      }
    }
  }, [agents]);

  useEffect(() => {
    // if (wallets.length > 0) {
    fetchHistory();
    // }
  }, [activeAgent])

  useEffect(() => {
    fetchSonicAgents();
  }, [])

  // useEffect(() => {
  //   if (agents.length > 0) {
  //     setActiveAgent(agents[0]);
  //   }
  // }, [agents])

  const fetchHistory = async () => {
    const history = await fetchChatHistory(activeAgent || "bridgeAgent");
    const filteredMessages = history?.threads?.filter(
      (msg: Message) => msg.message.trim() !== ""
    );

    setMessages(filteredMessages);
  }

  const fetchSonicAgents = async () => {
    const res = await fetchAgents();
    setAgents(res.agents);
  }

  const clearChatHistory = async () => {
    await clearHistory(activeAgent || "bridgeAgent");
    setMessages([])
  }

  const updateLastAiMessage = (newMessage: string) => {
    setMessages((prev) => {
      const updatedMessages = [...prev];
      const lastIndex = updatedMessages.length - 1;

      if (updatedMessages[lastIndex]?.role === "ai") {
        updatedMessages[lastIndex] = { role: "ai", message: newMessage };
      } else {
        updatedMessages.push({ role: "ai", message: newMessage });
      }

      return updatedMessages;
    });
  };

  // Chat functions & actions
  const handleChat = async () => {
    if (!message.trim()) return;
    if (isLoading) {
      return;
    }

    const userMessage: Message = { role: "human", message: message };
    setMessages((prev) => [...prev, userMessage]);
    setMessage(""); // Clear the input field

    setIsLoading(true);

    try {
      const response = await chat({ inputMessage: message, agentName: activeAgent || "bridgeAgent" });
      console.log("RES:", response);
      if (response?.success) {
        if (response?.data?.tool_response !== "None") {
          const toolMessage = JSON.parse(response?.data?.tool_response?.replace(/^"|"$/g, ""));
          console.log("TOOL MSG: ", toolMessage)

          if (toolMessage?.success) {
            if (toolMessage?.type === "bridge") {

              setMessages((prev) => [...prev, { role: "ai", message: `Bridge from ${toolMessage?.fromChain === "solanamainnet" ? "Solana" : "Sonic SVM"} to ${toolMessage?.fromChain === "solanamainnet" ? "Sonic SVM" : "Solana"} is in progress...` }]);
              setIsBridging(true);


            } else if (toolMessage?.type === "swap") {
              const { inputMint, outputMint, amount, poolId } = toolMessage;

              if (!inputMint || !outputMint || !amount || !poolId) {
                setMessages((prev) => [...prev, { role: "ai", message: `Input fields are missing...` }]);
                return;
              }

              setIsSwaping(true);

              setMessages((prev) => [...prev, { role: "ai", message: `Fetching pools...` }]);
              updateLastAiMessage(`Fetching swap raw data...`);
              updateLastAiMessage(`Swap is in progress...`);

            } else if (toolMessage?.type === "coinMarketCap") {
              const aiMessage: Message = { role: "ai", message: toolMessage?.response };
              setMessages((prev) => [...prev, aiMessage]);
              return;
            }
          } else {
            setMessages((prev) => [...prev, { role: "ai", message: "Something went wrong, Try again later!" }]);
            return;
          }
        }

        const aiMessage: Message = { role: "ai", message: response.data?.ai_message };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        setMessages((prev) => [...prev, { role: "ai", message: "Something went wrong!" }]);
      }
    } catch (error: any) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
      setIsBridging(false);
    }
  }


  return (
    <div className="chess-div flex flex-col items-center h-screen text-black">
      <div
        className="top-nav p-4 flex items-center md:gap-5 gap-3 w-full bg-white"
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
        <div className="xxl:text-lg xl:text-base text-[#21201C] font-semibold">
          CHAT
        </div>
        <MdKeyboardArrowRight className="w-6 h-6 text-[#21201C]" />
        <div className="text-gray-400 text-xs">VEJAS6QK0U1BTPQK</div>
      </div>


      <div className="flex md:flex-1 w-full h-[95%] md:h-0 overflow-hidden">
        {/* Sidebar */}
        <div className="hidden agents-box shadow bg-white md:flex flex-col md:w-[30%] lg:w-[29%] xl:w-[28%] p-4 m-4 rounded-lg border border-gray-700 overflow-hidden">
          {/* Header + Input */}
          <div className="flex-shrink-0">
            <h2
              className="text-lg text-[#21201C] font-semibold mb-2"
              style={{ fontFamily: "orbitron" }}
            >
              Agents
            </h2>
            <p
              className="text-sm text-gray-400 mb-4"
              style={{ fontFamily: "manrope" }}
            >
              Choose agents to perform specific tasks.
            </p>
            <div className="relative w-full flex items-center">
              <FaSearch className="absolute left-3 text-gray-400 xxl:text-lg xl:text-base" />
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full p-2 pl-10 bg-[#F1F0EF] text-[#21201C] rounded placeholder:font-manrope placeholder:text-base placeholder:text-gray-400 focus:outline-none"
                style={{ fontFamily: "manrope" }}
              />
            </div>
          </div>

          {/* Scrollable List (Fixed) */}
          <div className="flex-grow overflow-y-auto scroll-d agents-box p-3 mt-4 rounded max-h-[430px]">
            {agents.length > 0 && agents?.map((agent) => (
              <div
                key={agent}
                onClick={() => setActiveAgent(agent)}
                className={`p-4 rounded cursor-pointer rounded-md border transition-all mt-2 duration-200 agents-box shadow 
          ${activeAgent === agent
                    ? "border-[#fde68a]"
                    : "border-transparent hover:border-[#fde68a]"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <div className="logo h-6 w-6 p-1 rounded-[4px] bg-[#21201C]">
                      <img
                        src="/icons/network/near.svg"
                        alt={agent}
                        className="h-4 w-4 object-contain"
                      />
                    </div>
                    <h3 className="font-semibold text-md truncate-1-lines w-[90%]">
                      {agent === "bridgeAgent" ?
                        "Bridge Assistant" :
                        agent === "swapAgent" ?
                          "Swap Assistant" :
                          agent === "coinMarketCapAgent" ?
                            "CoinMarketCap Assistant" :
                            "Liquidity Assistant"}
                    </h3>
                  </div>
                  <IoMdInformationCircleOutline className="w-5 h-5 text-gray-400 cursor-pointer" />
                </div>
                <p className="text-sm text-gray-400 mt-1 w-[90%] truncate-3-lines">
                  {agent === "bridgeAgent" ?
                    "Assistant for helping users to bridge tokens between Solana & Sonic SVM chains." :
                    agent === "swapAgent" ?
                      "Assistant for helping users to swap tokens between Solana & Sonic SVM chains." :
                      agent === "coinMarketCapAgent" ?
                        "Assistant for helping users to know the current market price of the tokens & all over the crypto activities in the world." :
                        "Assistant for helping users to add liquidity to pool in Solana & Sonic SVM chains."}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center w-full md:w-[70%] lg:w-[71%] xl:w-[72%] md:px-0 md:py-0 py-2 px-1">
          {/* Execute Transactions with AI Box */}
          <div className="flex-1 flex flex-col items-center justify-center agents-box shadow rounded-lg md:mt-4 md:mx-4 p-[0.1rem] md:p-[0.4rem] lg:p-[0.7rem] xl:p-[1rem]">
            {messages.length > 0 && <div className="top w-full flex justify-between items-center px-5 md:px-0 border-b border-gray-700 md:pb-3 md:py-0 py-3 bg-white">
              <h2
                className="font-semibold text-md"
                style={{ fontFamily: "orbitron" }}
              >
                NEAR INTENTS
              </h2>
              <div className="div flex justify-end items-center gap-2">
                <h2
                  className="text-sm font-thin"
                  style={{ fontFamily: "orbitron" }}
                >
                  Clear History
                </h2>
                <div className="clear-chat w-[1.5rem] h-[1.5rem] flex items-center justify-center cursor-pointer" onClick={clearChatHistory}>
                  <InlineSVG
                    src="/icons/clear.svg"
                    className="fill-current bg-transparent text-[#21201C] bg-white rounded-md w-[1.5rem] h-[1.5rem]"
                  />
                </div>
              </div>
            </div>}
            {messages.length === 0 && <div className="text-center">
              <div className="flex justify-center items-center">
                <img
                  src="images/near-intent-logo.svg"
                  className="md:h-[50px] h-[40px]"
                />
              </div>
              <h2
                className="xxl:text-xl xl:text-lg font-semibold text-sm my-3"
                style={{ fontFamily: "orbitron" }}
              >
                Execute Transactions with AI
              </h2>

              {!state?.address && <div className="">
                <ConnectWallet />
              </div>}
              {/* {!isConnected && <button
                className="mt-4 bg-white text-black md:px-7 md:py-2 px-4 py-1 rounded font-semibold cursor-pointer"
                style={{ fontFamily: "manrope" }}
              >
                Connect
              </button>} */}
            </div>}
            {messages.length !== 0 && (
              <div className="w-full max-h-[70vh] md:max-h-[27rem] lg:max-h-[29rem] xl:max-h-[30rem] h-full px-4 scroll-d overflow-y-auto">
                {messages.map((msg, index) => (
                  <>
                    <div
                      key={index}
                      className={`message w-full h-auto flex gap-1 md:gap-2 lg:gap-3 my-2 ${msg.role === "ai" ? "justify-start" : "justify-end"}`}
                    >
                      {/* <p className={`px-3 py-2.5 max-w-md rounded-md w-auto ${msg.role === "ai" ? "bg-gray-800" : "bg-[#0000ff]"}`}>
                      {msg.message}
                    </p> */}

                      <div className={`px-3 py-2.5 max-w-md rounded-md w-auto text-white ${msg.role === "ai" ? "bg-[#21201C]" : "bg-[#00EC97]"} `}>
                        <MarkdownToJSX
                          options={{
                            disableParsingRawHTML: true,
                            overrides: {
                              table: {
                                props: {
                                  className:
                                    "table-auto w-full border-collapse border border-gray-300",
                                },
                              },
                              th: {
                                props: {
                                  className: "border border-gray-300 p-2 bg-gray-200 text-black min-w-[4rem]",
                                },
                              },
                              td: {
                                props: {
                                  className: "border border-gray-300 p-2",
                                },
                              }
                            },
                          }}
                        >
                          {msg.message}
                        </MarkdownToJSX>
                      </div>
                      {msg?.txHash && msg.role === "ai" && <>
                        <a href={`${msg?.fromChain === "solanamainnet" ? `https://explorer.solana.com/tx/${msg?.txHash}` : `https://explorer.sonic.game/tx/${msg?.txHash}`}`} target="_blank" rel="noopener noreferrer" className="approve-btn flex items-center justify-center gap-1 px-2  mt-1 min-w-[5rem] bg-grey-700 max-w-[9rem] rounded-3xl border-1 border-zinc-600 hover:border-zinc-400 cursor-pointer">
                          <h2 className="text-center dark:text-black text-sm">Check Explorer</h2>
                          <InlineSVG
                            src="/icons/goto.svg"
                            className="fill-current bg-transparent text-white w-2.5 h-2.8"
                          />
                        </a>
                      </>}
                    </div>
                    {isLoading && index === messages.length - 1 && <div className={`whole-div w-full flex items-center gap-1 justify-start`}>
                      <div className={`relative message px-3 py-2.5 flex items-center gap-1 rounded-lg max-w-xs bg-gray-800`}>
                        <p className={`text-sm text-white`}>Typing...</p>
                      </div>
                    </div>}
                    <div ref={messagesEndRef} />
                  </>
                ))}
              </div>
            )}
          </div>

          {/*Desktop */}
          <div className="flex md:flex hidden p-4 py-3 bg-white agents-box shadow rounded-lg md:m-4 mt-3">
            {/* Input Container */}

            <div className="flex-1 bg-[#F1F0EF] rounded flex md:flex-row flex-col md:items-center items-start agents-box shadow px-2">
              <span
                className="px-3 py-1 bg-[#f76b15] hidden md:block rounded text-white md:text-sm text-[8px] font-bold"
                style={{ fontFamily: "orbitron" }}
              >
                {activeAgent === "bridgeAgent" ? "Bridge Assistant" : activeAgent === "swapAgent" ? "Swap Assistant" : "SONIC ASSISTANT"}
              </span>
              <input
                type="text"
                placeholder="Message Smart Actions"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 md:p-2 mt-2 md:mt-0 bg-transparent outline-none text-[#21201C] md:ml-2 placeholder-gray-400"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleChat();
                  }
                }}
                style={{ fontFamily: "manrope" }}
              />
            </div>

            {/* Arrow Button */}
            <div
              className={`md:w-12 w-10 flex cursor-pointer justify-center items-center px-2 py-2 rounded ml-3 transition-all ${message.trim()
                ? "bg-[#00EC97] hover:bg-[#00EC97]"
                : "bg-[#F1F0EF]"
                }`}
              onClick={handleChat}
            >
              <BiUpArrowAlt className="w-8 h-8 text-white" />
            </div>
          </div>

          {/*Mobile -------------------*/}
          <div className="flex flex-col gap-3 py-4 px-3 bg-white agents-box shadow rounded-lg md:m-4 mt-3 md:hidden">
            <div className="flex flex-row items-center justify-between">
              {/* Active Agent Name */}
              <span
                className="px-3 py-1 bg-[#f76b15] rounded text-white text-xs md:text-sm font-bold"
                style={{ fontFamily: "orbitron" }}
              >
                {activeAgent === "bridgeAgent" ? "Bridge Assistant" : activeAgent === "swapAgent" ? "Swap Assistant" : "SONIC ASSISTANT"}
              </span>

              {/* Agents Button */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-1 bg-[#21201C] hover:bg-gray-600 text-white text-sm font-semibold rounded transition-all duration-200"
              >
                Agents
              </button>

              {/* Agents Modal */}
              <AgentsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                setActiveAgent={setActiveAgent}
                sonicAgents={agents}
              />
            </div>

            {/* Input Box & Send Button */}
            <div className="flex flex-row items-center bg-[#F1F0EF] rounded agents-box shadow px-3 py-2">
              <input
                type="text"
                placeholder="Message Smart Actions..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleChat();
                  }
                }}
                className="flex-1 bg-transparent outline-none text-[#21201C] text-sm placeholder-gray-400 p-2"
                style={{ fontFamily: "manrope" }}
              />

              {/* Send Button with Better Positioning */}
              <button
                className={`ml-3 p-2 rounded flex items-center justify-center transition-all ${message.trim()
                  ? "bg-[#00EC97] hover:bg-[#00EC97]"
                  : "bg-[#F1F0EF]"
                  }`}
                onClick={handleChat}
                disabled={!message.trim()}
              >
                <BiUpArrowAlt className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

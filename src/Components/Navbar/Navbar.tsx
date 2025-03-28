/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaRobot, FaLaptopCode } from "react-icons/fa6";
import { MdLink } from "react-icons/md";
import { HiMiniArrowUpRight } from "react-icons/hi2";
import InlineSVG from "react-inlinesvg";
import ConnectWallet from "../Wallet";
import "./Navbar.css";
import { useConnectWallet } from "@/hooks/useConnectWallet";
import { GrTransaction } from "react-icons/gr";
export default function Navbar({
  isCollapsed,
  isMobileNavVisible,
  onMobileNavToggle,
}: {
  isCollapsed: boolean;
  isMobileNavVisible: boolean;
  onMobileNavToggle: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isConnected, setIsConnected] = useState(false);
  const [isSoon, setIsSoon] = useState(false);
  const { state, signIn, connectors } = useConnectWallet();

  // Determine active tab based on current route
  const getActiveTab = () => {
    if (pathname === "/browse") return "Browse Agents";
    if (pathname === "/transaction") return "Transaction";
    return "Chat"; // Default active tab
  };

  const [active, setActive] = useState(getActiveTab);

  useEffect(() => {
    setActive(getActiveTab()); // Update state when route changes
  }, [pathname]);

  const handleNavigation = (page: string) => {
    setActive(page);
    if (page === "Browse Agents") {
      router.push("/browse");
    } else if (page === "Transaction") {
      router.push("/transaction");
    } else {
      router.push("/");
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isMobileNavVisible && (
        <div
          className="fixed inset-0 bg-white bg-opacity-20 backdrop-blur-sm z-30 md:hidden"
          onClick={onMobileNavToggle}
        />
      )}

      <nav
        className={`header fixed bg-white md:relative h-screen text-white p-4 flex-col justify-between transition-all ${
          isCollapsed && !isMobileNavVisible
            ? "w-20"
            : "w-[14rem] md:w-[15rem] lg:w-[16rem]"
        } ${
          isMobileNavVisible ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 z-50`}
      >
        <div className="flex flex-col h-full">
          {/* Logo and Menu Items */}
          <div>
            {/* Logo */}
            <div className="flex items-center space-x-2 font-semibold">
              <img
                src={
                  isCollapsed && !isMobileNavVisible
                    ? "images/mob-logo.png"
                    : "images/main-logo.png"
                }
                className="transition-all duration-300 h-9 w-auto"
                alt="Logo"
              />
            </div>

            {/* Menu Items */}
            <ul className="mt-6 space-y-2" style={{ fontFamily: "manrope" }}>
              <li>
                <button
                  className={`flex cursor-pointer items-center w-full gap-2 px-3 py-2 rounded-lg transition-colors ${
                    active === "Chat" && "bg-[#21201C]"
                  }`}
                  onClick={() => handleNavigation("Chat")}
                >
                  <FaLaptopCode
                    className={`w-8 h-8 ${
                      active === "Chat" ? "text-white" : "text-[#21201C]"
                    }`}
                  />
                  {(!isCollapsed || isMobileNavVisible) && (
                    <h2
                      className={`${
                        active === "Chat" ? "text-white" : "text-[#21201C]"
                      } text-lg font-bold`}
                    >
                      Chat
                    </h2>
                  )}
                </button>
              </li>
              <li>
                <button
                  className={`flex cursor-pointer items-center w-full px-3 gap-2 py-2 rounded-lg transition-colors ${
                    active === "Browse Agents" && "bg-[#21201C]"
                  }`}
                  onClick={() => handleNavigation("Browse Agents")}
                >
                  <FaRobot
                    className={`w-8 h-8 ${
                      active === "Browse Agents"
                        ? "text-white"
                        : "text-[#21201C]"
                    }`}
                  />
                  {(!isCollapsed || isMobileNavVisible) && (
                    <h2
                      className={`${
                        active === "Browse Agents"
                          ? "text-white"
                          : "text-[#21201C]"
                      } md:text-lg text-md md:font-bold font-semibold`}
                    >
                      Browse Agents
                    </h2>
                  )}
                </button>
              </li>
              <li>
                <button
                  className={`flex cursor-pointer items-center w-full px-3 gap-2 py-2 rounded-lg transition-colors ${
                    active === "Transaction" && "bg-[#21201C]"
                  }`}
                  onClick={() => handleNavigation("Transaction")}
                >
                  <GrTransaction
                    className={`w-8 h-8 ${
                      active === "Transaction" ? "text-white" : "text-[#21201C]"
                    }`}
                  />
                  {(!isCollapsed || isMobileNavVisible) && (
                    <h2
                      className={`${
                        active === "Transaction"
                          ? "text-white"
                          : "text-[#21201C]"
                      } md:text-lg text-md md:font-bold font-semibold`}
                    >
                      Transaction
                    </h2>
                  )}
                </button>
              </li>
            </ul>
            <div className="line my-4 w-full h-2"></div>
            {(!isCollapsed || isMobileNavVisible) && (
              <div className="mt-4 space-y-3">
                <div
                  onClick={
                    isMobileNavVisible
                      ? () => {
                          onMobileNavToggle();
                          setIsSoon(true);
                        }
                      : () => setIsSoon(true)
                  }
                  className="build-agent block flex items-center justify-between text-gray-400 text-lg font-semibold px-2 py-0 rounded-lg"
                >
                  <Link
                    href="#"
                    className="flex flex-row items-center gap-1"
                    style={{ fontFamily: "manrope" }}
                  >
                    Build Agent <HiMiniArrowUpRight />
                  </Link>
                  {/* <div className="soon px-2 py-1 bg-[#fbb042] rounded text-black md:text-sm text-[8px] font-semibold"
                    style={{ fontFamily: "orbitron" }}>
                    SOON
                  </div> */}
                </div>
                <div
                  onClick={
                    isMobileNavVisible
                      ? () => {
                          onMobileNavToggle();
                          setIsSoon(true);
                        }
                      : () => setIsSoon(true)
                  }
                  className="build-agent block flex items-center justify-between gap-1 text-gray-400 text-lg font-semibold px-2 py-0 rounded-lg"
                >
                  <Link
                    href="#"
                    className="flex flex-row items-center"
                    style={{ fontFamily: "manrope" }}
                  >
                    Documentation <HiMiniArrowUpRight />
                  </Link>
                  {/* <div className="soon px-2 py-1 bg-[#fbb042] rounded text-black md:text-sm text-[8px] font-semibold"
                    style={{ fontFamily: "orbitron" }}>
                    SOON
                  </div> */}
                </div>
              </div>
            )}
          </div>

          {/* Connect Wallet Button */}
          <div className="mt-auto">
            <button
              className="w-full py-2 rounded-lg cursor-pointer flex justify-center items-center gap-2 text-sm bg-white text-black font-bold transition"
              style={{ fontFamily: "manrope" }}
            >
              {state?.address && (
                <div className="">
                  <ConnectWallet />
                </div>
              )}
              {/* <div className="hidden md:block">
                <MdLink className="w-8 h-8" />
                <ConnectWallet />
              </div> */}
              {/* {(!isCollapsed || isMobileNavVisible) && (
                !isConnected ? <span>Connect Wallet</span> : <span>Disconnect</span>
              )} */}
            </button>
          </div>
        </div>
      </nav>

      {isSoon && (
        <div
          onClick={() => setIsSoon(false)}
          className={`absolute top-0 bottom-0 right-0 left-0 bg-transparent backdrop-blur-[25px] z-10 flex justify-center items-center ${
            isCollapsed && !isMobileNavVisible
              ? ""
              : " md:pl-[15rem] lg:pl-[16rem]"
          }`}
        >
          <div className="center-box w-[22rem] md:w-[24rem] lg:w-[25rem] xl:w-[26rem] min-h-[12rem] md:min-h-[15rem] bg-white rounded-md agents-box shadow-lg">
            <div className="top-close h-[2rem] w-full flex justify-end items-center pr-5 pt-5">
              <div
                className="clear-chat w-[1.5rem] h-[1.5rem] flex items-center justify-center cursor-pointer"
                onClick={() => setIsSoon(false)}
              >
                <InlineSVG
                  src="/icons/clear.svg"
                  className="fill-current bg-transparent text-[#21201C] bg-white rounded-md w-[1.5rem] h-[1.5rem]"
                />
              </div>
            </div>
            <div
              onClick={(e) => e.stopPropagation()}
              className="inside-box w-full pb-5 md:pb-[1.5rem] md:min-h-[15rem] min-[13rem] flex flex-col items-center justify-center gap-1"
            >
              <div className="flex justify-center items-center">
                <img
                  src="images/main-logo.png"
                  className="md:h-[40px] h-[30px]"
                />
              </div>
              <h2
                className="xxl:text-xl text-[#21201C] xl:text-lg font-semibold text-md mt-2"
                style={{ fontFamily: "orbitron" }}
              >
                NEAR INTENTS AGENTS
              </h2>
              <p className="text-md text-[#21201C]">Build your own agents!</p>
              <div
                className="soon max-w-[10rem] mt-2 text-center px-3 py-1 bg-[#F76B15] rounded text-white md:text-sm text-[8px] font-semibold"
                style={{ fontFamily: "orbitron" }}
              >
                COMING SOON
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

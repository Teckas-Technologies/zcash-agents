"use client";
import { useEffect, useState } from "react";
import InlineSVG from "react-inlinesvg";
import { MdKeyboardArrowRight } from "react-icons/md";
import useTransaction from "@/hooks/useTransactionHook";
import { useTransactionsHook } from "@/hooks/useTransactionsHook";

export default function Transaction({
  onToggle,
  onMobileNavToggle,
}: {
  onToggle: () => void;
  onMobileNavToggle: () => void;
}) {
  const [activeTab, setActiveTab] = useState("Bridge");
  const { loading, error, data } = useTransaction();
  const { fetchBridgeHistory, fetchSwapHistory } = useTransactionsHook();
  const [items, setItems] = useState<any[]>([]);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    // Navigate to the corresponding section if needed
  };

  const fetchData = async () => {
    if (activeTab === "Bridge") {
      const res = await fetchBridgeHistory();
      console.log("RES:", res)
      setItems(res.data || []);
    } else if (activeTab === "Swap") {
      const res = await fetchSwapHistory();
      console.log("RES:", res)
      setItems(res || []);
    }
  }

  useEffect(() => {
    fetchData();
  }, [activeTab])

  return (
    <div className="flex flex-col items-center h-screen w-full bg-gray-100">
      {/* Top Navigation */}
      <div
        className="top-nav p-4 flex items-center md:gap-5 gap-3 w-full bg-white"
        style={{ fontFamily: "orbitron" }}
      >
        <button
          onClick={() => {
            onToggle();
            if (window.innerWidth < 768) {
              onMobileNavToggle();
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
          {activeTab.toUpperCase()}
        </div>

        <MdKeyboardArrowRight className="w-6 h-6 text-[#21201C]" />

        {/* Tab Navigation */}
        <div className="flex gap-4 text-sm font-medium">
          {["Bridge", "Swap", "Trade"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className={`px-3 py-1 rounded-md transition ${activeTab === tab
                ? "bg-[#4dd092] text-white"
                : "text-gray-600 hover:bg-gray-200"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Section */}
      {activeTab === "Bridge" && (
        <div className="p-4 md:p-8 bg-gray-100 w-full flex-grow">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center pb-4">
              <h2 className="text-xl font-semibold">Transaction Details</h2>
            </div>

            {/* Scrollable Table Wrapper */}

            <div className="w-full flex-grow max-h-[calc(100vh-220px)] overflow-y-auto sm:overflow-x-auto">
              <div className="w-full min-w-[700px]">
                <table className="w-full bg-white rounded-lg overflow-hidden block md:table">
                  <thead className="bg-gray-100 text-gray-700 text-sm">
                    <tr className="text-left">
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        S.NO
                      </th>
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        Amount Bridged
                      </th>
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        Source Blockchain
                      </th>
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        Destination Blcokchain
                      </th>
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        Transaction Staus
                      </th>
                      <th className="hidden md:block py-2 md:px-4 px-1 whitespace-nowrap">
                        Explorer
                      </th>
                    </tr>
                  </thead>

                  <tbody className="text-sm">
                    {items && items.length !== 0 && items.map((transaction, index) => (
                      <tr key={transaction._id} className="border-b">
                        <td className="py-3 md:px-4 px-1 text-gray-700 whitespace-nowrap">
                          {index + 1}
                        </td>
                        <td className="py-3 md:px-4 px-1 whitespace-nowrap">
                          {(transaction?.amount / 10 ** 8).toFixed(8).replace(/\.?0+$/, "")}
                        </td>
                        <td className="py-3 md:px-4 px-1 whitespace-nowrap">
                          {"Zcash"}
                        </td>
                        <td className="py-3 md:px-4 px-1 whitespace-nowrap">
                          {"NEAR"}
                        </td>
                        <td className="py-3 md:px-4 px-1 font-semibold whitespace-nowrap">
                          {transaction.status}
                        </td>
                        <td className="hidden md:block py-3 md:px-4 px-1 text-gray-700 whitespace-nowrap">
                          <a
                            href={`https://mainnet.zcashexplorer.app/transactions/${transaction.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View Transaction
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === "Swap" && (
        <div className="p-4 md:p-8 bg-gray-100 w-full flex-grow">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center pb-4">
              <h2 className="text-xl font-semibold">Transaction Details</h2>
            </div>

            {/* Scrollable Table Wrapper */}

            <div className="w-full flex-grow max-h-[calc(100vh-220px)] overflow-y-auto sm:overflow-x-auto">
              <div className="w-full min-w-[700px]">
                <table className="w-full bg-white rounded-lg overflow-hidden block md:table">
                  <thead className="bg-gray-100 text-gray-700 text-sm">
                    <tr className="text-left">
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        S.NO
                      </th>

                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        Source Token
                      </th>
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        Destination Token
                      </th>
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        From Amount
                      </th>
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        To Amount
                      </th>
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        Transaction Staus
                      </th>
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap md:hidden block">
                        Explorer
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {items && items.length !== 0 && items?.map((transaction, index) => (
                      <tr key={transaction._id} className="border-b">
                        <td className="py-3 md:px-4 px-1 text-gray-700 whitespace-nowrap">
                          {index + 1}
                        </td>
                        <td className="py-3 md:px-4 px-1 whitespace-nowrap">
                          {transaction.from_token}
                        </td>
                        <td className="py-3 md:px-4 px-1 whitespace-nowrap">
                          {transaction.to_token}
                        </td>
                        <td className="py-3 md:px-4 px-1 whitespace-nowrap">
                          {transaction?.from_amount}
                        </td>
                        <td className="py-3 md:px-4 px-1 font-semibold whitespace-nowrap">
                          {transaction?.to_amount}
                        </td>
                        <td className="py-3 md:px-4 px-1 font-semibold whitespace-nowrap">
                          {"Completed"}
                        </td>

                        <td className="hidden md:block py-3 md:px-4 px-1 text-gray-700 whitespace-nowrap">
                          <a
                            href={`https://nearblocks.io/txns/${transaction.deposit_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View Transaction
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === "Trade" && (
        <div className="p-4 md:p-8 bg-gray-100 w-full flex-grow">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center pb-4">
              <h2 className="text-xl font-semibold">Transaction Details</h2>
            </div>

            {/* Scrollable Table Wrapper */}

            <div className="w-full flex-grow max-h-[calc(100vh-220px)] overflow-y-auto sm:overflow-x-auto">
              <div className="w-full min-w-[700px]">
                <table className="w-full bg-white rounded-lg overflow-hidden block md:table">
                  <thead className="bg-gray-100 text-gray-700 text-sm">
                    <tr className="text-left">
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        S.NO
                      </th>
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        Amount Invested
                      </th>
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        Invested Tokens
                      </th>
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        Trade Outcome
                      </th>
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        Transaction Staus
                      </th>
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        AI Strategy
                      </th>
                      <th className="hidden md:block py-2 md:px-4 px-1 whitespace-nowrap">
                        Transaction Details
                      </th>
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap md:hidden block">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {data.map((transaction, index) => (
                      <tr key={transaction._id} className="border-b">
                        <td className="py-3 md:px-4 px-1 text-gray-700 whitespace-nowrap">
                          {index + 1}
                        </td>
                        <td className="py-3 md:px-4 px-1 whitespace-nowrap">
                          {(transaction?.total_zec / 10 ** 8).toFixed(8).replace(/\.?0+$/, "")}
                        </td>
                        <td className="py-3 md:px-4 px-1 whitespace-nowrap">
                          {transaction.tokens_to_buy[0]?.symbol} , 
                          {transaction.tokens_to_buy[1]?.symbol}
                          {/* (
                          {transaction.tokens_to_buy[0]?.share}%) */}
                        </td>
                        <td className="py-3 md:px-4 px-1 whitespace-nowrap">
                          {/* {transaction.tokens_to_buy[1]?.symbol} (
                          {transaction.tokens_to_buy[1]?.share}%) */}
                          {(transaction?.final_zec / 10 ** 8).toFixed(8).replace(/\.?0+$/, "")}
                        </td>
                        <td className="py-3 md:px-4 px-1 font-semibold whitespace-nowrap">
                          {transaction.status}
                          {/* <span
                        className={`px-2 py-1 text-xs font-semibold rounded-lg ${
                          transaction.status === "Completed"
                            ? "bg-green-100 text-green-600"
                            : transaction.status === "Cancelled"
                            ? "bg-red-100 text-red-600"
                            : "bg-yellow-100 text-yellow-600"
                        }`}
                      >
                        {transaction.status}
                      </span> */}
                        </td>
                        <td className="py-3 md:px-4 px-1 font-semibold whitespace-nowrap">
                          {"Momentum 24h"}
                        </td>
                        <td className="hidden md:block py-3 md:px-4 px-1 text-gray-700 whitespace-nowrap">
                          <a
                            href={`https://nearblocks.io/txns/${transaction.deposit_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View Transaction
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

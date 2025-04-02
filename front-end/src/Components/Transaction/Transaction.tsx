"use client";
import { useEffect, useState } from "react";
import InlineSVG from "react-inlinesvg";
import { MdKeyboardArrowRight } from "react-icons/md";
import useTransaction from "@/hooks/useTransactionHook";
import { useTransactionsHook } from "@/hooks/useTransactionsHook";
import { useCapitalHook } from "@/hooks/useCapitalHook";
import Toast from "../Toast/Toast";

interface Props {
  onToggle: () => void;
  onMobileNavToggle: () => void;
}

export default function Transaction({ onToggle, onMobileNavToggle }: Props) {
  const [activeTab, setActiveTab] = useState("Bridge");
  const { loading, fetchBridgeHistory, fetchSwapHistory, fetchTradeHistory } = useTransactionsHook();
  const { closePosition } = useCapitalHook();
  const [items, setItems] = useState<any[]>([]);
  const [toast, setToast] = useState(false);
  const [toastSuccess, setToastSuccess] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastSubMsg, setToastSubMsg] = useState("");
  const [trigger, setTrigger] = useState(false);
  const [closing, setClosing] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    setItems([]);
    setCurrentPage(0)
    setTotalPages(0)
    // Navigate to the corresponding section if needed
  };

  const fetchData = async ({ page }: { page: number | null }) => {
    try {
      let response;

      if (activeTab === "Bridge") {
        response = await fetchBridgeHistory();
      } else if (activeTab === "Swap") {
        response = await fetchSwapHistory({ page: page });
      } else {
        response = await fetchTradeHistory({ page: page });
      }

      // Check if response is valid
      console.log("RES:", response);

      if (response && Array.isArray(response.data)) {
        setItems(response.data);
        setCurrentPage(response?.current_page - 1 || 0);
        setTotalPages(response?.total_pages || 0);
      } else if (response && Array.isArray(response)) {
        setItems(response); // In case response isn't nested under .data
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setItems([]);
    }
  };


  useEffect(() => {
    fetchData({ page: null });
  }, [activeTab, trigger])

  useEffect(() => {
    if (toast) {
      setTimeout(() => {
        setToast(false);
        setToastMsg("");
        setToastSubMsg("");
        setToastSuccess(false)
      }, 5000)
    }
  }, [toast])

  const handleClosePosition = async (id: string) => {
    setClosing(id)
    const res = await closePosition({ capitalId: id })

    if (res.success) {
      setToastMsg("Position closed successfully!");
      setToastSubMsg("The trade info will be updated in 2 mins");
      setToastSuccess(true);
      setToast(true);
      setClosing(null);
      setTrigger(!trigger);
    } else {
      setToastMsg("Please try again later!");
      setToastSubMsg("Something went wrong!");
      setToastSuccess(false);
      setToast(true);
      setClosing(null);
    }
  }

  const handlePageChange = (page: number) => {
    if (page >= 0 && page < totalPages) {
      fetchData({ page: page + 1 });
    }
  };

  const renderPagination = () => {
    const start = Math.max(0, currentPage - 2);
    const end = Math.min(totalPages, start + 5);
    return (
      <div className="flex space-x-2">
        <button className="text-xs cursor-pointer" onClick={() => handlePageChange(currentPage - 1)}>Previous</button>
        {Array.from({ length: end - start }, (_, i) => i + start).map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-1 cursor-pointer rounded-full ${page === currentPage ? 'bg-[#21201C] text-white' : 'bg-gray-200'}`}
          >
            {page + 1}
          </button>
        ))}
        <button className="text-xs cursor-pointer" onClick={() => handlePageChange(currentPage + 1)}>Next</button>
      </div>
    );
  };

  return (
    <div className="relative flex flex-col items-center h-screen w-full bg-gray-100">
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
      {activeTab === "Bridge" && !loading && items.length !== 0 && (
        <div className="p-4 md:p-8 bg-gray-100 w-full flex-grow">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center pb-4">
              <h2 className="text-xl font-semibold">Transaction Details</h2>
            </div>

            {/* Scrollable Table Wrapper */}

            <div className="w-full text-center max-h-[calc(100vh-220px)] overflow-y-auto sm:overflow-x-auto scroll-d">
              <div className="w-full min-w-[700px]">
                <table className="w-full bg-white rounded-lg overflow-hidden block md:table">
                  <thead className="bg-gray-100 text-gray-700 text-sm">
                    <tr className="">
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        S.NO
                      </th>
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        Amount
                      </th>
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        Source
                      </th>
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        Destination
                      </th>
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        Staus
                      </th>
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
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
                        <td className="flex justify-center py-3 md:px-4 px-1 text-gray-700 whitespace-nowrap">
                          {/* <a
                            href={`https://mainnet.zcashexplorer.app/transactions/${transaction.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View Transaction
                          </a> */}
                          <a href={`https://mainnet.zcashexplorer.app/transactions/${transaction.tx_hash}`} target="_blank" rel="noopener noreferrer" className="approve-btn flex items-center justify-center gap-1 px-2 py-1  mt-1 min-w-[6rem] max-w-[7rem] bg-grey-700 rounded-3xl border-1 border-zinc-600 hover:border-zinc-400 cursor-pointer">
                            <h2 className="text-center dark:text-black text-sm">Go to</h2>
                            <InlineSVG
                              src="/icons/goto.svg"
                              className="fill-current bg-transparent text-[#21201C] w-2.5 h-2.8"
                            />
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
      {activeTab === "Swap" && !loading && items.length !== 0 && (
        <div className="p-4 md:px-8 md:pt-8 md:pb-2 bg-gray-100 w-full">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center pb-4">
              <h2 className="text-xl font-semibold">Transaction Details</h2>
            </div>

            {/* Scrollable Table Wrapper */}

            <div className="w-full text-center flex-grow max-h-[calc(100vh-220px)] overflow-y-auto sm:overflow-x-auto scroll-d">
              <div className="w-full min-w-[700px]">
                <table className="w-full bg-white rounded-lg overflow-hidden block md:table">
                  <thead className="bg-gray-100 text-gray-700 text-sm">
                    <tr className="">
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        S.NO
                      </th>

                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        Source
                      </th>
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        Destination
                      </th>
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        From Amount
                      </th>
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        To Amount
                      </th>
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        Staus
                      </th>
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        Explorer
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {items && items.length !== 0 && items?.map((transaction, index) => (
                      <tr key={transaction._id || index} className="border-b">
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
                          {typeof transaction.from_amount === "string"
                            ? parseFloat(transaction.from_amount).toFixed(5)
                            : transaction.from_amount || "N/A"}
                        </td>
                        <td className="py-3 md:px-4 px-1 whitespace-nowrap">
                          {typeof transaction.to_amount === "string"
                            ? parseFloat(transaction.to_amount).toFixed(5)
                            : transaction.to_amount || "N/A"}
                        </td>
                        <td className="py-3 md:px-4 px-1 font-semibold whitespace-nowrap">
                          {"Completed"}
                        </td>

                        <td className="flex justify-center py-3 md:px-4 px-1 text-gray-700 whitespace-nowrap">
                          {/* <a
                            href={`https://nearblocks.io/txns/${transaction.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View Transaction
                          </a> */}
                          <a href={`https://mainnet.zcashexplorer.app/transactions/${transaction.tx_hash}`} target="_blank" rel="noopener noreferrer" className="approve-btn flex items-center justify-center gap-1 px-2 py-1  mt-1 min-w-[6rem] max-w-[7rem] bg-grey-700 rounded-3xl border-1 border-zinc-600 hover:border-zinc-400 cursor-pointer">
                            <h2 className="text-center dark:text-black text-sm">Go to</h2>
                            <InlineSVG
                              src="/icons/goto.svg"
                              className="fill-current bg-transparent text-[#21201C] w-2.5 h-2.8"
                            />
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
      {activeTab === "Trade" && !loading && items.length !== 0 && (
        <div className="p-4 md:px-8 md:pt-8 md:pb-2 bg-gray-100 w-full">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center pb-4">
              <h2 className="text-xl font-semibold">Transaction Details</h2>
            </div>

            {/* Scrollable Table Wrapper */}

            <div className="w-full text-center flex-grow max-h-[calc(100vh-220px)] overflow-y-auto sm:overflow-x-auto scroll-d">
              <div className="w-full min-w-[800px]">
                <table className="w-full bg-white rounded-lg overflow-hidden block md:table">
                  <thead className="bg-gray-100 text-gray-700 text-sm">
                    <tr className="">
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        S.NO
                      </th>
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        Amount (ZEC)
                      </th>
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        Invested Tokens
                      </th>
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        Outcome (ZEC)
                      </th>
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        Profit/Loss
                      </th>
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        Staus
                      </th>
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        AI Strategy
                      </th>
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        Explorer
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {items && items.length !== 0 && items?.map((transaction, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3 md:px-4 px-1 text-gray-700 whitespace-nowrap">
                          {index + 1}
                        </td>
                        <td className="py-3 md:px-4 px-1 whitespace-nowrap">
                          {typeof transaction.total_zec === "string"
                            ? parseFloat(transaction.total_zec).toFixed(5)
                            : transaction.total_zec || "N/A"}
                        </td>
                        <td className="py-3 md:px-4 px-1 whitespace-nowrap">
                          {transaction?.tokens_to_buy?.[0] ? `${transaction.tokens_to_buy[0].symbol}, ` : ""}
                          {transaction?.tokens_to_buy?.[1] ? `${transaction.tokens_to_buy[1].symbol}` : ""}
                        </td>
                        <td className={`py-3 md:px-4 px-1 whitespace-nowrap`}>
                          <p onClick={() => { (!transaction.final_zec && transaction?.status == "OPENED") && handleClosePosition(transaction?._id) }} className={`py-1 px-2 rounded-2xl ${!transaction.final_zec && transaction?.status == "OPENED" ? "border border-red-800 text-red-800 cursor-pointer" : ""}`}>
                            {!transaction.final_zec && transaction?.status == "OPENED" && closing !== transaction?._id ? "close position" :
                              !transaction.final_zec && transaction?.status == "OPENED" && closing && closing === transaction?._id ? "closing..." :
                                !transaction.final_zec && transaction?.status == "CREATED" ? "Investing..." :
                                  typeof transaction.final_zec === "string" ? parseFloat(transaction.final_zec).toFixed(5)
                                    : transaction.final_zec || "N/A"}</p>
                        </td>
                        <td className={`py-3 md:px-4 px-1 whitespace-nowrap ${(() => {
                          const totalZec = parseFloat(transaction.total_zec) || 0;
                          const finalZec = transaction.status === "OPENED" ? null : parseFloat(transaction.final_zec) || 0;

                          if (transaction.status === "OPENED" || finalZec === null) {
                            return "text-gray-500"; // You can apply a different color or styling for "Live" status
                          }

                          const profitLoss = finalZec - totalZec;
                          const formattedValue = profitLoss.toFixed(5);

                          // Apply conditional color classes
                          return profitLoss >= 0 ? "text-green-500" : "text-red-500";
                        })()}`}>
                          {(() => {
                            const totalZec = parseFloat(transaction.total_zec) || 0;
                            const finalZec = transaction.status === "OPENED" ? null : parseFloat(transaction.final_zec) || 0;

                            if (transaction.status === "OPENED" || finalZec === null) {
                              return "Live";
                            }

                            const profitLoss = finalZec - totalZec;
                            const formattedValue = profitLoss.toFixed(5);

                            return profitLoss >= 0 ? `+${formattedValue}` : formattedValue;
                          })()}
                        </td>


                        <td className="py-3 md:px-4 px-1 font-semibold whitespace-nowrap">
                          {transaction?.status || "Completed"}
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
                        <td className="w-auto flex justify-center py-3 md:px-4 px-1 text-gray-700 whitespace-nowrap">
                          {/* <a
                            href={`https://nearblocks.io/txns/${transaction?.deposit_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View Transaction
                          </a> */}
                          <a href={`https://mainnet.zcashexplorer.app/transactions/${transaction.deposit_hash}`} target="_blank" rel="noopener noreferrer" className="approve-btn flex items-center justify-center gap-1 px-2 py-1  mt-1 min-w-[6rem] max-w-[7rem] bg-grey-700 rounded-3xl border-1 border-zinc-600 hover:border-zinc-400 cursor-pointer">
                            <h2 className="text-center dark:text-black text-sm">Go to</h2>
                            <InlineSVG
                              src="/icons/goto.svg"
                              className="fill-current bg-transparent text-[#21201C] w-2.5 h-2.8"
                            />
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

      {loading && (
        <div className="p-4 md:p-8 bg-gray-100 w-full flex-grow">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center pb-4">
              <h2 className="text-xl font-semibold">Transaction Details</h2>
            </div>
            <div className="w-full flex-grow max-h-[calc(100vh-220px)] overflow-y-auto sm:overflow-x-auto">
              <div className="w-full min-w-[700px]">
                <table className="w-full bg-white rounded-lg overflow-hidden block md:table">
                  <thead className="bg-gray-100 text-gray-700 text-sm">
                    <tr className="text-left">
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        Fetching transaction details....
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="p-4 md:p-8 bg-gray-100 w-full flex-grow">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center pb-4">
              <h2 className="text-xl font-semibold">Transaction Details</h2>
            </div>
            <div className="w-full flex-grow max-h-[calc(100vh-220px)] overflow-y-auto sm:overflow-x-auto">
              <div className="w-full min-w-[700px]">
                <table className="w-full bg-white rounded-lg overflow-hidden block md:table">
                  <thead className="bg-gray-100 text-gray-700 text-sm">
                    <tr className="text-left">
                      <th className="py-2 md:px-4 px-1 whitespace-nowrap">
                        {activeTab === "Bridge" ? "No bridges!" : activeTab === "Swap" ? "No swaps!" : "No trades!"}
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {items.length > 0 && totalPages !== 0 && <div className="p-4 md:px-8 md:pt-2 md:pb-4 bg-gray-100 w-full flex-grow">
        <div className="bg-white p-4 md:p-4 rounded-lg shadow-lg flex justify-center">
          {renderPagination()}
        </div>
      </div>}

      {toast && <Toast success={toastSuccess} message={toastMsg} subMessage={toastSubMsg} onClose={() => setToast(false)} />}
    </div>
  );
}

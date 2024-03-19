import { useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { obfuscatePubKey } from "@/context/transactions";
interface Bet {
  wallet: string;
  betTime?: string;
  betEndTime?: string;
  betAmount: number;
  betType: boolean; // if true -> betUp else betDown
  strikePrice?: number;
  betEndPrice?: number;
  timeFrame: number;
  result: "Pending" | "Won" | "Lost";
  tokenMint?: string;
}

export default function Bets({ refresh }: { refresh: boolean }) {
  const wallet = useWallet();
  const transactionsPerPage = 10;
  const [all, setAll] = useState(wallet.publicKey ? false : true);

  const [page, setPage] = useState(1);

  const [maxPages, setMaxPages] = useState(0);

  const [bets, setBets] = useState<Bet[]>([]);

  const myHeaders = [
    "Date",
    "Bet Type",
    "Amount",
    "Strike Price",
    "Timeframe",
    "Result",
  ];

  const allHeaders = ["Date", "Wallet", "Bet Type", "Amount", "Result"];

  useEffect(() => {
    if (refresh) {
      const route = all
        ? "/api/options/getGlobalHistory"
        : `/api/options/getUserHistory?wallet=${wallet.publicKey?.toBase58()}`;

      fetch(`${route}`)
        .then((res) => res.json())
        .then((history) => {
          if (history.success) {
            setBets(history?.data ?? []);
            setMaxPages(Math.ceil(history?.data.length / transactionsPerPage));
          } else {
            setBets([]);
            // toast.error("Could not fetch history.");
          }
        });
    }
  }, [all, refresh]);

  return (
    <div className="flex w-full flex-col pb-10">
      {/* buttons  */}
      <div className="mt-[7rem] flex w-full items-center justify-center gap-4 px-5 md:justify-start md:px-[10%]">
        <button
          onClick={() => {
            if (wallet.publicKey) setAll(false);
            else toast.error("Wallet not connected");
          }}
          className={`${
            all
              ? "border-transparent"
              : "text-shadow-pink border-[#8A078A] bg-[#8A078A30]"
          } w-full transform rounded-[5px] border-[2px] px-8 py-2 font-changa text-lg text-white transition duration-200 hover:bg-[#8A078A30] md:w-fit`}
        >
          My Bets
        </button>
        <button
          onClick={() => {
            setAll(true);
          }}
          className={`${
            all
              ? "text-shadow-pink border-[#8A078A] bg-[#8A078A30]"
              : "border-transparent"
          } w-full transform rounded-[5px] border-[2px] px-8 py-2 font-changa text-lg text-white transition duration-200 hover:bg-[#8A078A30] md:w-fit`}
        >
          All Bets
        </button>
      </div>

      {/* table  */}
      <div className="scrollbar mt-10 w-full overflow-x-auto px-5 pb-8 md:px-[10%]">
        <div className="flex w-full min-w-[50rem] flex-col items-center">
          {/* header  */}
          {bets.length > 0 && (
            <div className="mb-5 flex w-full flex-row items-center gap-2">
              {!all
                ? myHeaders.map((header, index) => (
                    <span
                      key={index}
                      className="w-full text-center font-changa text-[#F0F0F080]"
                    >
                      {header}
                    </span>
                  ))
                : allHeaders.map((header, index) => (
                    <span
                      key={index}
                      className="w-full text-center font-changa text-[#F0F0F080]"
                    >
                      {header}
                    </span>
                  ))}
            </div>
          )}

          {bets.length > 0 ? (
            bets
              .slice(
                page * transactionsPerPage - transactionsPerPage,
                page * transactionsPerPage
              )
              .map((bet, index) => (
                <div
                  key={index}
                  className="mb-2.5 flex w-full flex-row items-center gap-2 rounded-[5px] bg-[#45054933] py-3"
                >
                  <span className="w-full text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                    {bet.betTime
                      ? new Date(bet.betTime).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                        })
                      : "-"}{" "}
                    {bet.betTime
                      ? new Date(bet.betTime).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </span>
                  {all && (
                    <span className="w-full text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                      {obfuscatePubKey(bet.wallet)}
                    </span>
                  )}
                  <span className="w-full text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                    {bet.betType ? "UP" : "DOWN"}
                  </span>
                  <span className="w-full text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                    {bet.betAmount}
                  </span>
                  {!all && (
                    <span className="w-full text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                      {bet.strikePrice?.toFixed(4)}
                    </span>
                  )}
                  {!all && (
                    <span className="w-full text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                      {bet.timeFrame}
                    </span>
                  )}
                  <span
                    className={`w-full text-center font-changa text-sm text-opacity-75 ${
                      bet.result === "Lost"
                        ? "text-[#CF304A]"
                        : bet.result === "Won"
                        ? "text-[#03A66D]"
                        : "text-[#F0F0F0]"
                    }`}
                  >
                    {bet.result}
                  </span>
                </div>
              ))
          ) : (
            <span className="ml-4 w-full font-changa text-[#F0F0F080]">
              No Bets made.
            </span>
          )}
        </div>
      </div>

      <div className="mb-8 mt-4 flex w-full cursor-pointer items-center justify-center gap-6 font-changa">
        <span
          onClick={() => {
            if (page > 1) setPage(page - 1);
          }}
          className="cursor-pointer text-[#F0F0F0]"
        >
          &lt;
        </span>
        {bets &&
          bets.length > 0 &&
          [...Array(maxPages)]
            .map((_, i) => ++i)
            .slice(0, 3)
            .map((i, index) => (
              <span
                key={index}
                onClick={() => {
                  setPage(i);
                }}
                className={`${
                  page === i ? "text-opacity-75" : "text-opacity-50"
                } text-[#F0F0F0] transition-all`}
              >
                {i}
              </span>
            ))}
        <span className="text-[#F0F0F0]">. . .</span>

        {bets &&
          bets.length > 0 &&
          [...Array(maxPages)]
            .map((_, i) => ++i)
            .slice(maxPages - 3, maxPages)
            .map((i, index) => (
              <span
                key={index}
                onClick={() => {
                  setPage(i);
                }}
                className={`${
                  page === i ? "text-opacity-75" : "text-opacity-50"
                } text-[#F0F0F0] transition-all`}
              >
                {i}
              </span>
            ))}
        <span
          onClick={() => {
            if (page != maxPages) setPage(page + 1);
          }}
          className="cursor-pointer text-[#F0F0F0]"
        >
          &gt;
        </span>
      </div>
    </div>
  );
}

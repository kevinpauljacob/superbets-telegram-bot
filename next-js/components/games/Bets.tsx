import { useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { obfuscatePubKey } from "@/context/transactions";
import { GameType } from "@/utils/provably-fair";
import { Table } from "../table/Table";
import BetRow from "../BetRow";
interface Bet {
  wallet: string;
  betTime?: string;
  betEndTime?: string;
  amount: number;
  betType: "betUp" | "betDown"; // if true -> betUp else betDown
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

  useEffect(() => {
    if (refresh) {
      const route = all
        ? `/api/games/global/getHistory?game=${GameType.options}`
        : `/api/games/global/getUserHistory?game=${
            GameType.options
          }&wallet=${wallet.publicKey?.toBase58()}`;

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
    <Table
      all={all}
      setAll={setAll}
      page={page}
      setPage={setPage}
      maxPages={maxPages}
      bets={bets}
    >
      {bets.length > 0 ? (
        bets
          .slice(
            page * transactionsPerPage - transactionsPerPage,
            page * transactionsPerPage,
          )
          .map((bet, index) => (
            <div
              key={index}
              className="mb-2.5 flex w-full flex-row items-center gap-2 rounded-[5px] bg-[#121418] py-3"
            >
              <BetRow bet={bet} all={all}/>
              {/* <span className="w-full text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
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
                <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                  {obfuscatePubKey(bet.wallet)}
                </span>
              )}
              <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                {bet.betType === "betUp" ? "UP" : "DOWN"}
              </span>
              <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                {bet.amount.toFixed(4)}
              </span>
              {!all && (
                <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                  {bet.strikePrice?.toFixed(4)}
                </span>
              )}
              {!all && (
                <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                  {bet.timeFrame}
                </span>
              )}
              <span
                className={`w-full hidden md:block text-center font-changa text-sm text-opacity-75 ${
                  bet.result === "Lost"
                    ? "text-[#CF304A]"
                    : bet.result === "Won"
                    ? "text-[#03A66D]"
                    : "text-[#F0F0F0]"
                }`}
              >
                {bet.result}
              </span>
              <span
                className={`w-full block md:hidden text-center  font-changa text-sm text-opacity-75 ${
                  bet.result === "Lost"
                    ? "text-[#CF304A]"
                    : bet.result === "Won"
                    ? "text-[#03A66D]"
                    : "text-[#F0F0F0]"
                }`}
              >
                {bet.result === "Pending"
                  ? "-"
                  : (bet.result === "Lost" ? 0 : bet.amount).toFixed(4)}
              </span> */}
            </div>
          ))
      ) : (
        <span className="font-changa text-[#F0F0F080]">No Bets made.</span>
      )}
    </Table>
  );
}

import { useWallet } from "@solana/wallet-adapter-react";
import { useGlobalContext } from "../GlobalContext";
import { useState, useEffect } from "react";
import { Table } from "../table/Table";
import BetRow from "./BetRow";

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

export default function Bets({ refresh, game }: { refresh: boolean, game: any }) {
  const wallet = useWallet();
  const transactionsPerPage = 10;
  const [all, setAll] = useState(wallet.publicKey ? false : true);
  const [page, setPage] = useState(1);
  const [maxPages, setMaxPages] = useState(0);
  const [bets, setBets] = useState<Bet[]>([]);
  
  const {
    isVerifyModalOpen: isOpen,
    setIsVerifyModalOpen: setIsOpen,
    openVerifyModal: openModal,
    closeVerifyModal: closeModal,
    setVerifyModalData,
  } = useGlobalContext();

  useEffect(() => {
    if (refresh) {
      const route = all
        ? `/api/games/global/getHistory?game=${game}`
        : `/api/games/global/getUserHistory?game=${game}&wallet=${wallet.publicKey?.toBase58()}`;

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

  const dummyBets = [
    {
      wallet: "57oQaJeLmnyMXj3QRxuU53BVHerWGmRx7ATvwWHhZXTJ",
      game: "coinflip",
      amount: 0.01,
      multiplier: 1.5,
      amountWon: 0.015,
    },
    {
      wallet: "3WZ8eABzLuR8PWrFFhURCQcrNupmRtWkZsDLNqayrUyP",
      game: "dice",
      amount: 0.02,
      multiplier: 2.0,
      amountWon: 0.04,
    },
    {
      wallet: "6GTsRDJwD7pyeNmWqkYb2qhwG26R7MnEvAqZpbUhSUT3",
      game: "dice2",
      amount: 0.03,
      multiplier: 2.5,
      amountWon: 0.075,
    },
    {
      wallet: "9Atq9QmqbBg6dNX34KPETVFkU5qScZVgsVR47h92MHyR",
      game: "limbo",
      amount: 0.04,
      multiplier: 3.0,
      amountWon: 0.12,
    },
    {
      wallet: "8KrZhywFq8xGav7DQ2wwFCKn2Jx3XZksUDqKGnvHUJJR",
      game: "wheel",
      amount: 0.05,
      multiplier: 3.5,
      amountWon: 0.175,
    },
    {
      wallet: "2NrMQB9Epxdrkbgm9gWseEU1qf3xzNM8YHmgWJ3p4njn",
      game: "keno",
      amount: 0.06,
      multiplier: 4.0,
      amountWon: 0.24,
    },
    {
      wallet: "4g3RrSMy9VQK6pXVzC3fegQMHjvT2r3jgwWGx3fK3UKc",
      game: "options",
      amount: 0.07,
      multiplier: 4.5,
      amountWon: 0.315,
    },
  ];

  return (
    <Table
      all={all}
      setAll={setAll}
      page={page}
      setPage={setPage}
      maxPages={maxPages}
      bets={bets}
    >
      {dummyBets.length > 0 ? (
        dummyBets
          .slice(
            page * transactionsPerPage - transactionsPerPage,
            page * transactionsPerPage,
          )
          .map((bet, index) => (
            <div
              key={index}
              className="mb-2.5 flex w-full flex-row items-center gap-2 rounded-[5px] bg-[#121418] py-3"
            >
              <BetRow bet={bet} all={all} openModal={openModal} setVerifyModalData={setVerifyModalData}/>
            </div>
          ))
      ) : (
        <span className="font-changa text-[#F0F0F080]">No Bets made.</span>
      )}
    </Table>
  );
}

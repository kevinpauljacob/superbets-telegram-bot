import { useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import { obfuscatePubKey } from "@/context/transactions";
import Image from "next/image";
import { useGlobalContext } from "@/components/GlobalContext";
import { GameType, seedStatus } from "@/utils/provably-fair";
import { Table } from "@/components/table/Table";
import BetRow from "@/components/BetRow";

export interface Dice {
  createdAt: string;
  wallet: string;
  chosenNumbers: number[];
  amount: number;
  result: "Won" | "Lost";
  strikeNumber: number;
  amountWon: number;
  nonce?: number;
  gameSeed?: {
    status: seedStatus;
    clientSeed: string;
    nonce: number;
    serverSeed?: string;
    serverSeedHash: string;
  };
}

export default function HistoryTable({ refresh }: { refresh: boolean }) {
  const wallet = useWallet();
  const [all, setAll] = useState(wallet.publicKey ? false : true);

  const {
    isVerifyModalOpen: isOpen,
    setIsVerifyModalOpen: setIsOpen,
    openVerifyModal: openModal,
    closeVerifyModal: closeModal,
    setVerifyModalData,
  } = useGlobalContext();


  const [page, setPage] = useState(1);
  const [bets, setBets] = useState<Dice[]>([]);
  const transactionsPerPage = 10;
  const [maxPages, setMaxPages] = useState(0);

  useEffect(() => {
    const route = all
      ? `/api/games/global/getHistory?game=${GameType.dice}`
      : `/api/games/global/getUserHistory?game=${GameType.dice
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
              className={`mb-2.5 ml-2.5 mr-2.5 flex w-full flex-row items-center gap-2 rounded-[5px] bg-[#121418] py-3 cursor-pointer`}
              onClick={() => {
                //fetch flipDetails and verification details here

                // if (!all) {
                setVerifyModalData(bet);
                openModal();
                // }
              }}
            >
              <BetRow bet={bet} all={all} />
            </div>
          ))
      ) : (
        <span className="w-full text-center font-changa text-[#F0F0F080]">
          No Flips made.
        </span>
      )}
    </Table>
  );
}

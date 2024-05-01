import { useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import { obfuscatePubKey } from "@/context/transactions";
import { useGlobalContext } from "@/components/GlobalContext";
import { GameType, seedStatus } from "@/utils/provably-fair";
import { Table } from "@/components/table/Table";

export interface Dice2 {
  createdAt: string;
  wallet: string;
  rollOver: number;
  direction: string;
  amount: number;
  result: string;
  strikeNumber: number;
  amountWon: number;
  chance: number;
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
  const [bet, setBet] = useState<Dice2>();
  const [bets, setBets] = useState<Dice2[]>([]);
  const transactionsPerPage = 10;
  const [maxPages, setMaxPages] = useState(0);

  useEffect(() => {
    const route = all
      ? `/api/games/global/getHistory?game=${GameType.dice2}`
      : `/api/games/global/getUserHistory?game=${
          GameType.dice2
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
            <>
              <div
                key={index}
                className={`mb-2.5 ml-2.5 mr-2.5 flex w-full flex-row items-center gap-2 rounded-[5px] bg-[#121418] py-3 cursor-pointer`}
                onClick={() => {
                  //fetch flipDetails and verification details here

                  if (!all) {
                    setVerifyModalData(bet);
                    openModal();
                  }
                }}
              >
                <span className="w-full text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                  {bet.createdAt
                    ? new Date(bet.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                      })
                    : "-"}{" "}
                  {bet.createdAt
                    ? new Date(bet.createdAt).toLocaleTimeString("en-GB", {
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
                <span className="w-full hidden md:block capitalize text-center font-changa text-sm text-[#F0F0F0] ">
                  {bet.direction}
                </span>
                <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0]">
                  {bet.amount} SOL
                </span>
                <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0]">
                  {bet.strikeNumber}
                </span>
                <span
                  className={`w-full text-center font-changa text-sm ${
                    bet.result === "Won" ? "text-[#72F238]" : "text-[#F1323E]"
                  }`}
                >
                  {bet.amountWon.toFixed(4)} SOL
                </span>
              </div>
            </>
          ))
      ) : (
        <span className="w-full text-center font-changa text-[#F0F0F080]">
          No Flips made.
        </span>
      )}
    </Table>
  );
}

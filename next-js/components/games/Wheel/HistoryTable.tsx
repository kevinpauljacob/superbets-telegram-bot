import { useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import { obfuscatePubKey } from "@/context/transactions";
import { useGlobalContext } from "@/components/GlobalContext";
import { GameType, seedStatus } from "@/utils/provably-fair";
import { Table } from "@/components/table/Table";

export interface Wheel {
  createdAt: string;
  wallet: string;
  amount: number;
  risk: string;
  segments: number;
  result: string;
  strikeNumber: number;
  strikeMultiplier: number;
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
  const [bet, setBet] = useState<Wheel>();
  const [bets, setBets] = useState<Wheel[]>([]);
  const transactionsPerPage = 10;
  const [maxPages, setMaxPages] = useState(0);

  const headers = [
    "Time",
    "Risk",
    "Segments",
    "Bet Amount",
    "Result",
    "Amount Won",
  ];
  const allHeaders = [
    "Time",
    "Wallet",
    "Risk",
    "Segments",
    "Bet Amount",
    "Result",
    "Amount Won",
  ];

  //headers to be displayed in small screen devices
  const smallScreenHeaders = ["Time", "Amount Won"];
  const allSmallScreenHeaders = ["Time", "Amount Won"];

  useEffect(() => {
    const route = all
      ? `/api/games/global/getHistory?game=${GameType.wheel}`
      : `/api/games/global/getUserHistory?game=${
          GameType.wheel
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

    console.log("bets", bets);
  }, [all, refresh]);

  return (
    <Table
      all={all}
      setAll={setAll}
      myHeaders={headers}
      allHeaders={allHeaders}
      smallScreenHeaders={smallScreenHeaders}
      allSmallScreenHeaders={allSmallScreenHeaders}
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
                className={`mb-2.5 ml-2.5 mr-2.5 flex w-full flex-row items-center gap-2 rounded-[5px] bg-[#121418] py-3 ${
                  !all && "cursor-pointer"
                }`}
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
                  {bet.risk}
                </span>
                <span className="w-full hidden md:block capitalize text-center font-changa text-sm text-[#F0F0F0] ">
                  {bet.segments}
                </span>
                <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0]">
                  {bet.amount} SOL
                </span>
                <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0]">
                  {bet.strikeMultiplier}
                </span>
                <span
                  className={`w-full text-center font-changa text-sm ${
                    bet.result === "Won" ? "text-fomo-green" : "text-fomo-red"
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

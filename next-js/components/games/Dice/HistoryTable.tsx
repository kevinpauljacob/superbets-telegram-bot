import { useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import { obfuscatePubKey } from "@/context/transactions";
import Image from "next/image";
import { useGlobalContext } from "@/components/GlobalContext";
import { GameType, seedStatus } from "@/utils/vrf";
import { Table } from "@/components/table/Table";

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

  const headers = ["Time", "Bet Faces", "Bet Amount", "Result", "Amount Won"];
  const allHeaders = [
    "Time",
    "Wallet",
    "Bet Faces",
    "Bet Amount",
    "Result",
    "Amount Won",
  ];

  //headers to be displayed in small screen devices
  const smallScreenHeaders = ["Time", "Amount Won"];
  const allSmallScreenHeaders = ["Time", "Amount Won"];

  useEffect(() => {
    const route = all
      ? `/api/games/global/getHistory?game=${GameType.dice}`
      : `/api/games/global/getUserHistory?game=${
          GameType.dice
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
                <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                  {bet.chosenNumbers.map((face, index) => (
                    <span key={index} className="mr-2 mt-2 inline-block">
                      <Image
                        src={`/assets/selectedDiceFace${face}.png`}
                        width={30}
                        height={30}
                        alt=""
                      />
                    </span>
                  ))}
                </span>
                <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                  {(bet.amount ?? 0).toFixed(4)}
                </span>
                <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                  <span className="mr-2 mt-2 inline-block">
                    <Image
                      src={`/assets/selectedDiceFace${bet.strikeNumber}.png`}
                      width={30}
                      height={30}
                      alt=""
                    />
                  </span>
                </span>
                <span
                  className={`w-full text-center font-changa text-sm text-opacity-75 ${
                    bet.result === "Lost"
                      ? "text-[#CF304A]"
                      : bet.result === "Won"
                      ? "text-[#03A66D]"
                      : "text-[#F0F0F0]"
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

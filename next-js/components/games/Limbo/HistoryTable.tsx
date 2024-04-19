import { useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect, Fragment } from "react";
import { obfuscatePubKey } from "@/context/transactions";
import { GameType, seedStatus } from "@/utils/provably-fair";
import { useGlobalContext } from "@/components/GlobalContext";
import { Table } from "@/components/table/Table";

export interface Limbo {
  chance: number;
  createdAt: string;
  wallet: string;
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

export default function StatsHistory({ refresh }: { refresh: boolean }) {
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
  const [flips, setFlips] = useState<Limbo[]>([]);
  const transactionsPerPage = 10;
  const [maxPages, setMaxPages] = useState(0);

  const headers = ["Time", "Multiplier", "Bet Amount", "Result", "Amount Won"];
  const allHeaders = [
    "Time",
    "Wallet",
    "Multiplier",
    "Bet Amount",
    "Result",
    "Amount Won",
  ];

  //headers to be displayed in small screen devices
  const smallScreenHeaders = ["Time", "Amount Won"];
  const allSmallScreenHeaders = ["Time", "Amount Won"];

  useEffect(() => {
    const route = all
      ? `/api/games/global/getHistory?game=${GameType.limbo}`
      : `/api/games/global/getUserHistory?game=${
          GameType.limbo
        }&wallet=${wallet.publicKey?.toBase58()}`;

    fetch(`${route}`)
      .then((res) => res.json())
      .then((history: any) => {
        if (history.success) {
          setFlips(history?.data ?? []);
          setMaxPages(Math.ceil(history?.data.length / transactionsPerPage));
        } else {
          setFlips([]);
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
      bets={flips}
    >
      {flips.length > 0 ? (
        flips
          .slice(
            page * transactionsPerPage - transactionsPerPage,
            page * transactionsPerPage,
          )
          .map((flip, index) => (
            <Fragment key={index}>
              <div
                key={index}
                className={`mb-2.5 ml-2.5 mr-2.5 flex w-full flex-row items-center gap-2 rounded-[5px] bg-[#121418] py-3 ${
                  !all && "cursor-pointer"
                }`}
                onClick={() => {
                  //fetch flipDetails and verification details here
                  if (!all) {
                    setVerifyModalData(flip);
                    openModal();
                  }
                }}
              >
                <span className="w-full text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                  {flip.createdAt
                    ? new Date(flip.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                      })
                    : "-"}{" "}
                  {flip.createdAt
                    ? new Date(flip.createdAt).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </span>
                {all && (
                  <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                    {obfuscatePubKey(flip.wallet)}
                  </span>
                )}
                <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                  {(100 / flip.chance).toFixed(2)}
                </span>
                <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                  {flip.amount.toFixed(4)}
                </span>
                <span
                  className={`w-full hidden md:block text-center font-changa text-sm text-opacity-75 ${
                    flip.result === "Lost"
                      ? "text-[#CF304A]"
                      : flip.result === "Won"
                      ? "text-[#03A66D]"
                      : "text-[#F0F0F0]"
                  }`}
                >
                  {flip.result}
                </span>
                <span
                  className={`w-full block md:hidden text-center  font-changa text-sm text-opacity-75 ${
                    flip.result === "Lost"
                      ? "text-[#CF304A]"
                      : flip.result === "Won"
                      ? "text-[#03A66D]"
                      : "text-[#F0F0F0]"
                  }`}
                >
                  {flip.amountWon.toFixed(4)} SOL
                </span>
                <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                  {flip.amountWon > 0 ? flip.amountWon.toFixed(4) : "-"}
                </span>
              </div>
            </Fragment>
          ))
      ) : (
        <span className="w-full text-center font-changa text-[#F0F0F080]">
          No Flips made.
        </span>
      )}
    </Table>
  );
}

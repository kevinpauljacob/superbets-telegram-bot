import { useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { obfuscatePubKey } from "@/context/transactions";
import { GameType, seedStatus } from "@/utils/vrf";
import VerifyFlipModal from "./VerifyFlipModal";

export interface Flip {
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

  //My Flip Modal handling
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const [page, setPage] = useState(1);
  const [flip, setFlip] = useState<Flip>();
  const [flips, setFlips] = useState<Flip[]>([]);
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
    <div className="flex w-full flex-col">
      {/* buttons  */}
      <div className="mt-[7rem] flex w-full items-center justify-center gap-4 md:justify-start">
        <button
          onClick={() => {
            if (wallet.publicKey) setAll(false);
            else toast.error("Wallet not connected");
          }}
          className={`${
            all ? "text-shadow-violet hover:bg-[#7839C530]" : "bg-[#7839C5]"
          } w-full transform rounded-[5px] px-8 py-2 font-changa text-lg text-white transition duration-200 md:w-fit`}
        >
          My Bets
        </button>
        <button
          onClick={() => {
            setAll(true);
          }}
          className={`${
            all ? "bg-[#7839C5]" : "text-shadow-violet hover:bg-[#7839C530]"
          } w-full transform rounded-[5px] px-8 py-2 font-changa text-lg text-white transition duration-200 md:w-fit`}
        >
          All Bets
        </button>
      </div>

      {/* table  */}
      <div className="scrollbar mt-10 w-full md:overflow-x-auto px-5 pb-8">
        <div className="flex w-full md:min-w-[50rem] flex-col items-center">
          {/* header  */}
          {flips.length > 0 && (
            <>
              <div className="mb-5 hidden md:flex w-full flex-row items-center rounded-[5px] py-1 bg-[#121418] gap-2">
                {!all
                  ? headers.map((header, index) => (
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
              <div className="mb-5 flex md:hidden w-full flex-row items-center rounded-[5px] py-1 bg-[#121418] gap-2">
                {!all
                  ? smallScreenHeaders.map((header, index) => (
                      <span
                        key={index}
                        className="w-full text-center font-changa text-[#F0F0F080]"
                      >
                        {header}
                      </span>
                    ))
                  : allSmallScreenHeaders.map((header, index) => (
                      <span
                        key={index}
                        className="w-full text-center font-changa text-[#F0F0F080]"
                      >
                        {header}
                      </span>
                    ))}
              </div>
            </>
          )}

          {flips.length > 0 ? (
            flips
              .slice(
                page * transactionsPerPage - transactionsPerPage,
                page * transactionsPerPage,
              )
              .map((flip, index) => (
                <div
                  key={index}
                  className={`mb-2.5 ml-2.5 mr-2.5 flex w-full flex-row items-center gap-2 rounded-[5px] bg-[#121418] py-3 ${
                    !all && "cursor-pointer"
                  }`}
                  onClick={() => {
                    //fetch flipDetails and verification details here
                    if (!all) {
                      setFlip(flip);
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
              ))
          ) : (
            <span className="w-full text-center font-changa text-[#F0F0F080]">
              No Flips made.
            </span>
          )}
        </div>
      </div>

      <div className="mb-8 mt-4 flex w-full items-center justify-center gap-6 font-changa">
        <span
          onClick={() => {
            if (page > 1) setPage(page - 1);
          }}
          className="cursor-pointer text-[#F0F0F0]"
        >
          &lt;
        </span>
        {flips &&
          flips.length > 0 &&
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

        {flips &&
          flips.length > 0 &&
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
      <VerifyFlipModal
        isOpen={isOpen}
        onClose={closeModal}
        modalData={{ flip: flip! }}
      />
    </div>
  );
}

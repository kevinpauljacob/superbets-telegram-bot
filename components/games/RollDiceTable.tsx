import { useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { obfuscatePubKey } from "@/context/transactions";
import Image from "next/image";
import VerifyBetModal from "../VerifyBetModal";
import { GameType, seedStatus } from "@/utils/vrf";

export interface Bet {
  createdAt: string;
  wallet: string;
  chosenNumbers: number[];
  amount: number;
  result: "Won" | "Lost";
  strikeNumber: number;
  amountWon: number;
  gameSeed?: {
    status: seedStatus;
    clientSeed: string;
    nonce: number;
    serverSeed?: string;
    serverSeedHash: string;
  };
}

export default function RollDiceTable({ refresh }: { refresh: boolean }) {
  const wallet = useWallet();
  const [all, setAll] = useState(wallet.publicKey ? false : true);

  //My Bet Modal handling
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const [page, setPage] = useState(1);

  const [bets, setBets] = useState<Bet[]>([]);
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

  useEffect(() => {
    const route = all
      ? "/api/games/dice/getGlobalHistory"
      : `/api/games/dice/getUserHistory?wallet=${wallet.publicKey?.toBase58()}`;

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
    <div className="flex w-full flex-col pb-10">
      <div className="mt-[4rem] flex w-full items-center justify-center text-white font-semibold gap-4 md:justify-start ">
        <button
          onClick={() => {
            if (wallet.publicKey) setAll(false);
            else toast.error("Wallet not connected");
          }}
          className={`${
            all ? "bg-[#202329]" : "bg-[#7839C5]"
          } rounded-md transition duration-300 ease-in-out px-8 py-1.5`}
        >
          My Bets
        </button>
        <button
          onClick={() => {
            setAll(true);
          }}
          className={`${
            all ? "bg-[#7839C5]" : "bg-[#202329]"
          } rounded-md transition duration-300 ease-in-out px-8 py-1.5`}
        >
          All Bets
        </button>
      </div>
      <div className="mt-10 w-full overflow-x-auto pb-8">
        <div className="flex w-full min-w-[50rem] flex-col items-center">
          {/* header  */}
          {bets.length > 0 && (
            <div className="mb-5 flex w-full flex-row items-center bg-[#121418] rounded-md py-1 gap-2">
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
          )}
          {bets.length > 0 ? (
            bets
              .slice(
                page * transactionsPerPage - transactionsPerPage,
                page * transactionsPerPage,
              )
              .map((bet, index) => (
                <>
                  <VerifyBetModal
                    isOpen={isOpen}
                    onClose={closeModal}
                    modalData={{ game: GameType.dice, bet }}
                  />
                  <div
                    key={index}
                    className={`mb-2.5 ml-2.5 mr-2.5 flex w-full flex-row items-center gap-2 rounded-[5px] bg-[#121418] py-3 ${
                      !all && "cursor-pointer"
                    }`}
                    onClick={() => {
                      if (!all) openModal();
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
                      <span className="w-full text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                        {obfuscatePubKey(bet.wallet)}
                      </span>
                    )}
                    <span className="w-full text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                      {bet.chosenNumbers.map((face, index) => (
                        <span key={index} className="mr-2 mt-2 inline-block">
                          <Image
                            src={`/assets/finalDiceFace${face}.png`}
                            width={30}
                            height={30}
                            alt=""
                          />
                        </span>
                      ))}
                    </span>
                    <span className="w-full text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                      {bet.amount} SOL
                    </span>
                    <span className="w-full text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                      <span className="mr-2 mt-2 inline-block">
                        <Image
                          src={`/assets/finalDiceFace${bet.strikeNumber}.png`}
                          width={30}
                          height={30}
                          alt=""
                        />
                      </span>
                    </span>
                    <span className="w-full text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                      {bet.amountWon} SOL
                    </span>
                  </div>
                </>
              ))
          ) : (
            <span className="w-full text-center font-changa text-[#F0F0F080]">
              No Bets made.
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

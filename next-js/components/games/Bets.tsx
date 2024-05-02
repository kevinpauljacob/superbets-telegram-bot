import { useWallet } from "@solana/wallet-adapter-react";
import { useGlobalContext } from "../GlobalContext";
import { useState, useEffect } from "react";
import { Table } from "../table/Table";
import BetRow from "./BetRow";

interface Bet {
  wallet: string;
  game: string;
  amount: number;
  strikeMultiplier: number;
  payout: number;
  result: "Pending" | "Won" | "Lost";
}

export default function Bets({
  refresh,
  game,
}: {
  refresh: boolean;
  game: any;
}) {
  const wallet = useWallet();
  const transactionsPerPage = 10;
  const [all, setAll] = useState(wallet.publicKey ? false : true);
  const [page, setPage] = useState(1);

  const [allBetMaxPages, setAllBetMaxPages] = useState(0);
  const [myBetMaxPages, setMyBetMaxPages] = useState(0);

  const [allBets, setAllBets] = useState<Bet[]>([]);
  const [myBets, setMyBets] = useState<Bet[]>([]);

  const {
    isVerifyModalOpen: isOpen,
    setIsVerifyModalOpen: setIsOpen,
    openVerifyModal: openModal,
    closeVerifyModal: closeModal,
    setVerifyModalData,
  } = useGlobalContext();

  useEffect(() => {
    const route = `/api/games/global/getHistory`;

    fetch(`${route}`)
      .then((res) => res.json())
      .then((history) => {
        if (history.success) {
          setAllBets(history?.data ?? []);
          setAllBetMaxPages(
            Math.ceil(history?.data.length / transactionsPerPage),
          );
        }
      });
  }, []);

  useEffect(() => {
    if (!wallet) return;
    const route = `/api/games/global/getUserHistory?wallet=${wallet.publicKey?.toBase58()}`;

    fetch(`${route}`)
      .then((res) => res.json())
      .then((history) => {
        if (history.success) {
          setMyBets(history?.data ?? []);
          setMyBetMaxPages(
            Math.ceil(history?.data.length / transactionsPerPage),
          );
        }
      });
  }, [wallet.publicKey]);

  return (
    <Table
      all={all}
      setAll={setAll}
      page={page}
      setPage={setPage}
      maxPages={all ? allBetMaxPages : myBetMaxPages}
      bets={all ? allBets : myBets}
    >
      {(all ? allBets.length : myBets.length) ? (
        (all ? allBets : myBets)
          .slice(
            page * transactionsPerPage - transactionsPerPage,
            page * transactionsPerPage,
          )
          .map((bet, index) => (
            <div
              key={index}
              className="mb-2.5 flex w-full flex-row items-center gap-2 rounded-[5px] bg-[#121418] py-3"
            >
              <BetRow
                bet={bet}
                all={all}
                openModal={openModal}
                setVerifyModalData={setVerifyModalData}
              />
            </div>
          ))
      ) : (
        <span className="font-changa text-[#F0F0F080]">No Bets made.</span>
      )}
    </Table>
  );
}

import { useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import { Table } from "../table/Table";
import { useGlobalContext } from "../GlobalContext";
import { useRouter } from "next/router";

interface Bet {
  _id: string;
  wallet: string;
  game: string;
  amount: number;
  strikeMultiplier: number;
  payout: number;
  result: "Pending" | "Won" | "Lost";
  userTier: number;
}

export default function Bets({ refresh }: { refresh: boolean }) {
  const wallet = useWallet();
  const transactionsPerPage = 10;
  const [all, setAll] = useState(wallet.publicKey ? false : true);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [myBetMaxPages, setMyBetMaxPages] = useState(0);
  const [myBets, setMyBets] = useState<Bet[]>([]);

  const [allBetMaxPages, setAllBetMaxPages] = useState(0);
  const [allBets, setAllBets] = useState<Bet[]>([]);

  const { liveBets } = useGlobalContext();

  const router = useRouter();
  const home = router.pathname.split("/")[1] === "";
  console.log("All bets:", allBets);
  useEffect(() => {
    if (!all) {
      setMyBets((prev) => {
        liveBets
          .filter((bet) => bet.wallet === wallet.publicKey?.toBase58())
          .forEach((bet) => {
            const index = prev.findIndex((b) => b._id === bet._id);
            if (index !== -1) {
              prev[index] = bet;
            } else {
              prev.unshift(bet);
            }
          });
        return prev;
      });
    } else {
      setAllBets((prev) => {
        liveBets.forEach((bet) => {
          const index = prev.findIndex((b) => b._id === bet._id);
          if (index !== -1) {
            prev[index] = bet;
          } else {
            prev.unshift(bet);
          }
        });
        return prev;
      });
    }
  }, [liveBets]);

  useEffect(() => {
    setPage(1);
    setLoading(true);

    if (all) {
      const route = `/api/games/global/getHistory`;

      fetch(`${route}`)
        .then((res) => res.json())
        .then((history) => {
          if (history.success) {
            setAllBets(history?.data ?? []);
            setAllBetMaxPages(
              Math.ceil(history?.data.length / transactionsPerPage),
            );
          } else {
            setAllBets([]);
            setAllBetMaxPages(1);
          }
        })
        .catch(() => {
          setAllBets([]);
          setAllBetMaxPages(1);
        })
        .finally(() => setLoading(false));
    } else if (wallet?.publicKey) {
      const route = `/api/games/global/getUserHistory?wallet=${wallet.publicKey?.toBase58()}`;

      fetch(`${route}`)
        .then((res) => res.json())
        .then((history) => {
          if (history.success) {
            setMyBets(history?.data ?? []);
            setMyBetMaxPages(
              Math.ceil(history?.data.length / transactionsPerPage),
            );
          } else {
            setMyBets([]);
            setMyBetMaxPages(1);
          }
        })
        .catch(() => {
          setMyBets([]);
          setMyBetMaxPages(1);
        })
        .finally(() => setLoading(false));
    }
  }, [all]);

  return (
    <div
      className={`relative w-full ${home ? "mt-[2rem] md:mt-[4rem] mb-5:" : ""}`}
    >
      <Table
        all={all}
        setAll={setAll}
        page={page}
        setPage={setPage}
        maxPages={all ? allBetMaxPages : myBetMaxPages}
        bets={all ? allBets : myBets}
        loading={loading}
      />
    </div>
  );
}

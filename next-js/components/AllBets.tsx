import { useState, useEffect } from "react";
import { useGlobalContext } from "./GlobalContext";
import { Table } from "./table/Table";
import { translator } from "@/context/transactions";

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

export default function AllBets() {
  const [allBets, setAllBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(false);

  const { liveBets, language } = useGlobalContext();

  useEffect(() => {
    const updatedBets = [...allBets];
    liveBets.forEach((bet) => {
      const index = updatedBets.findIndex((b) => b._id === bet._id);
      if (index !== -1) {
        updatedBets[index] = bet;
      } else {
        updatedBets.unshift(bet);
      }
    });
    setAllBets(updatedBets);
  }, [liveBets]);

  useEffect(() => {
    setLoading(true);
    const route = `/api/games/global/getHistory`;
    fetch(`${route}`)
      .then((res) => res.json())
      .then((history) => {
        if (history.success) {
          const limitedBets = history.data.slice(0, 10);
          setAllBets(limitedBets);
        } else {
          setAllBets([]);
        }
      })
      .catch(() => {
        setAllBets([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative mt-5 mb-5">
      <Table
        all={true}
        setAll={() => {}}
        page={1}
        setPage={() => {}}
        maxPages={1}
        bets={allBets}
        loading={loading}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[11rem] bg-[linear-gradient(0deg,#0F0F0F_0%,rgba(15,15,15,0.00)_100%)] pointer-events-none"
        style={{ zIndex: 1 }}
      ></div>
    </div>
  );
}

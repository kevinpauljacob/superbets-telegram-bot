import { useState, useEffect } from "react";
import { useGlobalContext } from "./GlobalContext";
import { Table } from "./table/Table";
import { translator } from "@/context/transactions";
import Image from "next/image";
import Dollar from "@/public/assets/dollar.png";

interface Bet {
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
    const newBets = liveBets.filter((bet) => {
      return !allBets.includes(bet);
    });
    setAllBets((prev) => {
      return newBets.concat(prev);
    });
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
    <div className="mt-5 mb-5">
      <div className="flex items-center mb-6">
        <Image src={Dollar} alt="" width={26} height={26} />
        <span className="font-medium font-changa text-xl text-opacity-90 pl-3">
          <span className="hidden sm:inline">
            {translator("Bets", language)}
          </span>
          <span className="sm:hidden">{translator("Bets", language)}</span>
        </span>
      </div>
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
        className="absolute inset-x-0 bottom-2 h-[10rem] bg-[linear-gradient(0deg,#0F0F0F_0%,rgba(15,15,15,0.00)_100%)] pointer-events-none"
        style={{ zIndex: 1 }}
      ></div>
    </div>
  );
}

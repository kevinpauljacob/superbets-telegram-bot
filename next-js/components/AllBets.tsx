import { useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import { TableAll } from "./table/TableAll";
import { wsEndpoint } from "@/context/gameTransactions";
import { useGlobalContext } from "./GlobalContext";

interface Bet {
  wallet: string;
  game: string;
  amount: number;
  strikeMultiplier: number;
  payout: number;
  result: "Pending" | "Won" | "Lost";
}

export default function AllBets() {
  const [allBets, setAllBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(false);

  const { liveBets } = useGlobalContext();

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
          setAllBets(history?.data ?? []);
        } else {
          setAllBets([]);
        }
      })
      .catch(() => {
        setAllBets([]);
      }).finally(() => 
        setLoading(false)
      );
  }, []);

  return (
    <TableAll
      bets={allBets}
      loading={loading}
    />
  );
}

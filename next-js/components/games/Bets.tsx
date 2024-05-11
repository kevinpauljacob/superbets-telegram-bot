import { useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import { Table } from "../table/Table";
import { wsEndpoint } from "@/context/gameTransactions";

interface Bet {
  wallet: string;
  game: string;
  amount: number;
  strikeMultiplier: number;
  payout: number;
  result: "Pending" | "Won" | "Lost";
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

  useEffect(() => {
    const socket = new WebSocket(wsEndpoint);

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          clientType: "listener-client",
          channel: "fomo-casino_games-channel",
        }),
      );
    };

    socket.onmessage = async (event) => {
      const response = JSON.parse(event.data.toString());

      if (!response.payload) return;

      const payload = response.payload;
      if (!all && payload.wallet === wallet.publicKey?.toBase58())
        setMyBets((prev) => {
          return [payload, ...prev];
        });
      else
        setAllBets((prev) => {
          return [payload, ...prev];
        });
    };

    return () => {
      socket.close();
    };
  }, []);

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
    <Table
      all={all}
      setAll={setAll}
      page={page}
      setPage={setPage}
      maxPages={all ? allBetMaxPages : myBetMaxPages}
      bets={all ? allBets : myBets}
      loading={loading}
    />
  );
}

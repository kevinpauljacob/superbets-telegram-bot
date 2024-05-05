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

export default function Bets({
  refresh,
}: {
  refresh: boolean;
}) {
  const wallet = useWallet();
  const transactionsPerPage = 10;
  const [all, setAll] = useState(wallet.publicKey ? false : true);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [maxPages, setMaxPages] = useState(0);
  const [bets, setBets] = useState<Bet[]>([]);

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
      if (all && payload.wallet !== wallet.publicKey?.toBase58())
        setBets((prev) => {
          return [payload, ...prev];
        });
    };

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    if (!all && !wallet) return;
    const route = all
      ? `/api/games/global/getHistory`
      : `/api/games/global/getUserHistory?wallet=${wallet.publicKey?.toBase58()}`;

    fetch(`${route}`)
      .then((res) => res.json())
      .then((history) => {
        if (history.success) {
          setLoading(false);
          if (all) {
            setBets(history?.data ?? []);
            setMaxPages(Math.ceil(history?.data.length / transactionsPerPage));
          } else if (!all && wallet.publicKey) {
            setBets(history?.data ?? []);
            setMaxPages(Math.ceil(history?.data.length / transactionsPerPage));
          } else {
            setBets([]);
            setMaxPages(1);
          }
        } else {
          setBets([]);
          setMaxPages(1);
        }
      });
  }, [refresh, all]);

  return (
    <Table
      all={all}
      setAll={setAll}
      page={page}
      setPage={setPage}
      maxPages={maxPages}
      bets={bets}
      // loading={loading}
    />
  );
}

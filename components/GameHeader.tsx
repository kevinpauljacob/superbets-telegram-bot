import { useRouter } from "next/router";
import Image from "next/image";
import fair from "/public/assets/fair.png";
import { useEffect, useState } from "react";
import ProvablyFairModal from "./ProvablyFairModal";
import { useWallet } from "@solana/wallet-adapter-react";
import { GameType } from "@/utils/vrf";
import { useGlobalContext } from "./GlobalContext";

export default function GameHeader() {
  const wallet = useWallet();
  const router = useRouter();

  const { coinData } = useGlobalContext();

  //Provably Fair Modal handling
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const [modalData, setModalData] = useState({
    activeGameSeed: {
      wallet: "",
      clientSeed: "",
      serverSeed: "",
      serverSeedHash: "",
      nonce: 0,
      status: "",
    },
    nextGameSeed: {
      wallet: "",
      clientSeed: "",
      serverSeed: "",
      serverSeedHash: "",
      nonce: 0,
      status: "",
    },
    totalBets: "",
    game: GameType.dice,
  });

  // Extract the game name from the route path
  const game = router.pathname.split("/")[1];

  useEffect(() => {
    if (!wallet?.publicKey) return;

    const fetchProvablyFairData = async (walletPubkey: string) => {
      const res = await fetch(`/api/games/vrf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: walletPubkey,
        }),
      });

      let data = await res.json();
      if (data.success) setModalData({ ...data, game });
    };

    fetchProvablyFairData(wallet.publicKey.toBase58());
  }, [wallet.publicKey]);

  useEffect(() => {
    const fetchGameData = (game: GameType) => {
      fetch(`/api/games/getStats?game=${game}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success)
            setGameData((prev) => ({
              ...prev,
              [game]: {
                ...prev[game],
                stats: data.stats,
              },
            }));
        });
    };

    if (!Object.entries(GameType).some(([_, value]) => value === game)) return;

    fetchGameData(game as GameType);
  }, []);

  // Define game data for different games
  const [gameData, setGameData] = useState<
    Record<
      string,
      {
        icon: string;
        name: string;
        stats?: { volume: number; players: number; balance: number };
      }
    >
  >({
    dice: {
      icon: "/assets/dice.png",
      name: "Dice To Win",
    },
    coinflip: {
      icon: "/assets/coinflip.png",
      name: "Fomo Flip",
    },
    options: {
      icon: "/assets/binary.png",
      name: "Binary Options",
    },
  });

  // Get the game details based on the extracted game name
  const selectedGame = gameData[game];

  // If the selected game exists, render its details, otherwise render null
  return selectedGame ? (
    <div className="text-white border-y border-[#1E2220] bg-[#121418] px-4 py-2">
      <div className="flex flex-col md:flex-row justify-between">
        <div className="flex items-center">
          <Image
            src={selectedGame.icon}
            alt={selectedGame.name}
            width={30}
            height={30}
          />
          <p className="uppercase font-bold text-xl min-w-[150px] ml-2">
            {selectedGame.name}
          </p>
        </div>
        <div className="flex flex-wrap mt-1">
          <div className="flex items-center justify-between bg-[#1E2220] rounded-md mx-1.5  my-1 px-2 py-1">
            <p className="font-light text-xs">Wallet Balance :&nbsp;</p>
            <p className="text-[#1FCDF0] font-semibold text-xs">
              {coinData ? coinData[0].amount.toFixed(4) : 0} $SOL
            </p>
          </div>
          <div className="flex items-center justify-between bg-[#1E2220] rounded-md mx-1.5  my-1 px-2 py-1">
            <p className="font-light text-xs">Volume :&nbsp;</p>
            <p className="text-[#7839C5] font-semibold text-xs">
              {selectedGame.stats?.volume.toFixed(2)}
            </p>
          </div>
          <div className="flex items-center justify-between bg-[#1E2220] rounded-md mx-1.5  my-1 px-2 py-1">
            <p className="font-light text-xs">Unique Players :&nbsp;</p>
            <p className="text-[#7839C5] font-semibold text-xs">
              {selectedGame.stats?.players}
            </p>
          </div>
          <div className="flex items-center gap-2 mx-1.5 my-1 ">
            <p
              className="underline text-[#94A3B8] decoration-[#94A3B8] underline-offset-2 hover:cursor-pointer text-xs"
              onClick={openModal}
            >
              Provabaly Fair
            </p>
            <Image src={fair} alt="Fairness" width={20} height={20} />
          </div>
        </div>
      </div>
      <ProvablyFairModal
        isOpen={isOpen}
        onClose={closeModal}
        modalData={modalData}
        setModalData={setModalData}
      />
    </div>
  ) : null;
}

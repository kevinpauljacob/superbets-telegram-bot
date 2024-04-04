import { useRouter } from "next/router";
import Image from "next/image";
import fair from "/public/assets/fair.png";
import { useEffect, useState } from "react";
import RollDiceProvablyFairModal from "./games/RollDice/RollDiceProvablyFairModal";
import { useWallet } from "@solana/wallet-adapter-react";
import { GameType } from "@/utils/vrf";
import { useGlobalContext } from "./GlobalContext";
import CoinFlipProvablyFairModal from "./games/CoinFlip/CoinFlipProvablyFairModal";

export default function GameHeader() {
  const wallet = useWallet();
  const router = useRouter();
  const game = router.pathname.split("/")[1];

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

  // Define game data for different games
  const gameData: Record<
    string,
    {
      icon: string;
      name: string;
      stats: {
        volume: string;
        players: string;
        balance: string;
      };
    }
  > = {
    dice: {
      icon: "/assets/dice.png",
      name: "Dice To Win",
      stats: {
        volume: "23,567",
        players: "23,567",
        balance: "2.3",
      },
    },
    coinflip: {
      icon: "/assets/coinflip.png",
      name: "Fomo Flip",
      stats: {
        volume: "15,432",
        players: "19,876",
        balance: "3.7",
      },
    },
    binary: {
      icon: "/assets/binary.png",
      name: "Binary",
      stats: {
        volume: "10,234",
        players: "14,567",
        balance: "1.8",
      },
    },
  };

  // Extract the game name from the route path
  const gameName = router.pathname.split("/")[1];

  // Get the game details based on the extracted game name
  const selectedGame = gameData[gameName];

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
              {selectedGame.stats.volume}
            </p>
          </div>
          <div className="flex items-center justify-between bg-[#1E2220] rounded-md mx-1.5  my-1 px-2 py-1">
            <p className="font-light text-xs">Unique Players :&nbsp;</p>
            <p className="text-[#7839C5] font-semibold text-xs">
              {selectedGame.stats.players}
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
      {game === "coinflip" ? (
        <CoinFlipProvablyFairModal
          isOpen={isOpen}
          onClose={closeModal}
          modalData={modalData}
          setModalData={setModalData}
        />
      ) : (
        <RollDiceProvablyFairModal
          isOpen={isOpen}
          onClose={closeModal}
          modalData={modalData}
          setModalData={setModalData}
        />
      )}
    </div>
  ) : null;
}

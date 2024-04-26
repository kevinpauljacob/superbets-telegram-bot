import { useRouter } from "next/router";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { GameType } from "@/utils/provably-fair";
import { useGlobalContext } from "./GlobalContext";
import { useSession } from "next-auth/react";
import RollDiceProvablyFairModal from "./games/Dice/DiceProvablyFairModal";
import Dice2ProvablyFairModal from "./games/Dice2/Dice2ProvablyFairModal";
import CoinFlipProvablyFairModal from "./games/CoinFlip/CoinFlipProvablyFairModal";
import LimboProvablyFairModal from "./games/Limbo/LimboProvablyFairModal";
import WheelProvablyFairModal from "./games/Wheel/WheelProvablyFairModal";
import KenoProvablyFairModal from "./games/Keno/KenoProvablyFairModal";

export default function GameHeader() {
  const { data: session, status } = useSession();

  const wallet = useWallet();
  const router = useRouter();
  const game = router.pathname.split("/")[1];

  const { coinData, getProvablyFairData } = useGlobalContext();

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
  });

  useEffect(() => {
    (async () => {
      if (wallet?.publicKey && session?.user) {
        const pfData = await getProvablyFairData();
        if (pfData) setModalData(pfData);
      }
    })();
  }, [wallet.publicKey, session?.user]);

  useEffect(() => {
    const fetchGameData = (game: GameType) => {
      fetch(`/api/games/global/getStats?game=${game}`)
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
    limbo: {
      icon: "/assets/binary.png",
      name: "Limbo",
    },
    dice2: {
      icon: "/assets/dice.png",
      name: "Dice 2",
    },
    wheel: {
      icon: "/assets/dice.png",
      name: "Wheel",
    },
    keno: {
      icon: "/assets/dice.png",
      name: "Keno",
    },
  });

  // Get the game details based on the extracted game name
  const selectedGame = gameData[game];

  // If the selected game exists, render its details, otherwise render null
  return selectedGame ? (
    <div className="w-full flex items-center text-white border-y sm:border-b border-[#1E2220] bg-[#121418] px-4 h-[4rem]">
      <div className="flex flex-row w-full items-center justify-between">
        <div className="flex items-center">
          <Image
            src={selectedGame.icon}
            alt={selectedGame.name}
            width={30}
            height={30}
          />
          <p className="uppercase font-changa font-bold text-opacity-90 text-3xl min-w-[150px] ml-2">
            {selectedGame.name}
          </p>
        </div>
        <div className="flex flex-wrap mt-1 justify-end">
          {/* <div className="hidden md:flex items-center justify-between bg-[#1E2220] rounded-md mx-1.5  my-1 px-2 py-1">
            <p className="font-light text-xs">Wallet Balance :&nbsp;</p>
            <p className="text-[#1FCDF0] font-semibold text-xs">
              {coinData ? coinData[0].amount.toFixed(4) : 0} $SOL
            </p>
          </div> */}
          <div className="hidden md:flex items-center justify-between bg-[#1E2220] rounded-md mx-1.5  my-1 px-4 py-1">
            <p className="font-thin text-xs">Volume :&nbsp;</p>
            <p className="text-[#7839C5] font-semibold text-xs">
              {selectedGame.stats?.volume.toFixed(2)}
            </p>
          </div>
          <div className="hidden md:flex items-center justify-between bg-[#1E2220] rounded-md mx-1.5  my-1 px-4 py-1">
            <p className="font-thin text-xs">Unique Players :&nbsp;</p>
            <p className="text-[#7839C5] font-semibold text-xs">
              {selectedGame.stats?.players}
            </p>
          </div>
          <div className="flex items-center gap-2 mx-1.5 my-1 ">
            <p
              className="underline text-[#94A3B8] decoration-[#94A3B8] underline-offset-2 hover:cursor-pointer text-xs font-medium"
              onClick={openModal}
            >
              Provably Fair
            </p>
            <Image
              src={"/assets/fair.png"}
              alt="Fairness"
              width={20}
              height={20}
            />
          </div>
        </div>
      </div>
      {game === GameType.coin ? (
        <CoinFlipProvablyFairModal
          isOpen={isOpen}
          onClose={closeModal}
          modalData={modalData}
          setModalData={setModalData}
        />
      ) : game === GameType.dice ? (
        <RollDiceProvablyFairModal
          isOpen={isOpen}
          onClose={closeModal}
          modalData={modalData}
          setModalData={setModalData}
        />
      ) : game === GameType.dice2 ? (
        <Dice2ProvablyFairModal
          isOpen={isOpen}
          onClose={closeModal}
          modalData={modalData}
          setModalData={setModalData}
        />
      ) : game === GameType.limbo ? (
        <LimboProvablyFairModal
          isOpen={isOpen}
          onClose={closeModal}
          modalData={modalData}
          setModalData={setModalData}
        />
      ) : game === GameType.wheel ? (
        <WheelProvablyFairModal
          isOpen={isOpen}
          onClose={closeModal}
          modalData={modalData}
          setModalData={setModalData}
        />
      ) : game === GameType.keno ? (
        <KenoProvablyFairModal
          isOpen={isOpen}
          onClose={closeModal}
          modalData={modalData}
          setModalData={setModalData}
        />
      ) : null}
    </div>
  ) : null;
}

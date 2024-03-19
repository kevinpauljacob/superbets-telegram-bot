import { useRouter } from "next/router";
import Image from "next/image";

export default function GameHeader() {
  const router = useRouter();

  // Define game data for different games
  const gameData = {
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
    <div className="hidden sm:block text-white border-y border-[#1E2220] bg-[#121418] px-4 py-2">
      <div className="flex justify-between">
        <div className="flex">
          <Image
            src={selectedGame.icon}
            alt={selectedGame.name}
            width={30}
            height={30}
          />
          <p className="uppercase font-bold text-xl ml-2">
            {selectedGame.name}
          </p>
        </div>
        <div className="flex">
          <div className="flex items-center justify-between bg-[#1E2220] rounded-md mx-1.5 px-2 py-1">
            <p>Volume :&nbsp;</p>
            <p className="text-[#7839C5]">{selectedGame.stats.volume}</p>
          </div>
          <div className="flex items-center justify-between bg-[#1E2220] rounded-md mx-1.5 px-2 py-1">
            <p>Players :&nbsp;</p>
            <p className="text-[#7839C5]">{selectedGame.stats.players}</p>
          </div>
          <div className="flex items-center justify-between bg-[#1E2220] rounded-md mx-1.5 px-2 py-1">
            <p>Balance :&nbsp;</p>
            <p className="text-[#1FCDF0]">{selectedGame.stats.balance} $SOL</p>
          </div>
        </div>
      </div>
    </div>
  ) : null;
}

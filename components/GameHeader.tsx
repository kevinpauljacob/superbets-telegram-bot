import Image from "next/image";

export default function GameHeader() {
  const gameData = [
    {
      icon: "/assets/dice.png",
      name: "Dice To Win",
      stats: {
        volume: "23,567",
        players: "23,567",
        balance: "2.3",
      },
    },
  ];

  return (
    <div className="hidden sm:block text-white border-y border-[#1E2220] bg-[#121418] px-4 py-2">
      {gameData.map((game, index) => (
        <div key={index} className="flex justify-between">
          <div className="flex">
            <Image src={game.icon} alt={game.name} width={30} height={30} />
            <p className="uppercase font-bold text-xl ml-2">{game.name}</p>
          </div>
          <div className="flex">
            <div className="flex items-center justify-between bg-[#1E2220] rounded-md mx-1.5 px-2 py-1">
              <p>Volume :&nbsp;</p>
              <p className="text-[#7839C5]">{game.stats.volume}</p>
            </div>
            <div className="flex items-center justify-between bg-[#1E2220] rounded-md mx-1.5 px-2 py-1">
              <p>Players :&nbsp;</p>
              <p className="text-[#7839C5]">{game.stats.players}</p>
            </div>
            <div className="flex items-center justify-between bg-[#1E2220] rounded-md mx-1.5 px-2 py-1">
              <p>Balance :&nbsp;</p>
              <p className="text-[#1FCDF0]">{game.stats.balance} $SOL</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

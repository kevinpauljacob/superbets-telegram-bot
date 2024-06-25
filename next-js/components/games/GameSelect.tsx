import { GameType } from "@/utils/provably-fair";
import React from "react";

interface GameSelectProps {
  selectedGameType: GameType;
  setSelectedGameType: (gameType: GameType) => void;
}

const GameSelect: React.FC<GameSelectProps> = ({
  selectedGameType,
  setSelectedGameType,
}) => {
  return (
    <select
      name="game"
      value={selectedGameType}
      onChange={(e) => setSelectedGameType(e.target.value as GameType)}
      className="bg-[#202329] text-white font-chakra text-xs font-medium mt-1 rounded-md px-5 py-4 w-full relative appearance-none focus:ring-0 focus:outline-none"
    >
      <option value={GameType.keno}>Keno</option>
      <option value={GameType.dice}>Dice</option>
      <option value={GameType.coin}>Coin Flip</option>
      <option value={GameType.roulette1}>Roulette</option>
      <option value={GameType.mines}>Mines</option>
      <option value={GameType.dice2}>Dice2</option>
      <option value={GameType.limbo}>Limbo</option>
      <option value={GameType.wheel}>Wheel</option>
      <option value={GameType.plinko}>Plinko</option>

    </select>
  );
};

export default GameSelect;

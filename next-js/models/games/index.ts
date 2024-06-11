export { default as Coin } from "./coin";
export { default as Dice } from "./dice";
export { default as Option } from "./option";
export { default as Dice2 } from "./dice2";
export { default as Hilo } from "./hilo";
export { default as Keno } from "./keno";
export { default as Limbo } from "./limbo";
export { default as Mines } from "./mines";
export { default as Plinko } from "./plinko";
export { default as Roulette1 } from "./roulette1";
export { default as Roulette2 } from "./roulette2";
export { default as Wheel } from "./wheel";
export { default as GameStats } from "./gameStats";
export { default as Referral } from "./referral";

export { default as GameSeed } from "./gameSeed";
export { default as User } from "./gameUser";

import { GameType } from "@/utils/provably-fair";
import {
  Coin,
  Dice,
  Dice2,
  Option,
  Hilo,
  Keno,
  Limbo,
  Mines,
  Plinko,
  Roulette1,
  Roulette2,
  Wheel,
} from "./";

export const gameModelMap = {
  [GameType.coin]: Coin,
  [GameType.dice]: Dice,
  [GameType.options]: Option,
  [GameType.dice2]: Dice2,
  [GameType.keno]: Keno,
  [GameType.limbo]: Limbo,
  [GameType.plinko]: Plinko,
  [GameType.roulette1]: Roulette1,
  [GameType.roulette2]: Roulette2,
  [GameType.wheel]: Wheel,
  [GameType.mines]: Mines,
  [GameType.hilo]: Hilo,
};

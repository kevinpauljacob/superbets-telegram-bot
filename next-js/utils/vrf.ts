import * as crypto from "crypto";

// Before the game round:
export const generateClientSeed = () => {
  return crypto.randomBytes(8).toString("hex");
};

export const generateServerSeed = () => {
  const serverSeed = crypto.randomBytes(32).toString("hex");
  const serverSeedHash = crypto
    .createHash("sha256")
    .update(serverSeed)
    .digest("hex");

  return { serverSeed, serverSeedHash };
};

const generateGameHash = (
  serverSeed: string,
  clientSeed: string,
  nonce: number,
): string => {
  const combinedSeed = serverSeed + clientSeed + nonce.toString();
  const hash = crypto.createHash("sha256").update(combinedSeed).digest("hex");

  return hash;
};

export enum seedStatus {
  EXPIRED = "EXPIRED",
  ACTIVE = "ACTIVE",
  NEXT = "NEXT",
}

export enum GameType {
  dice = "dice",
  coin = "coinflip",
  options = "options",
  dice2 = "dice2",
  wheel = "wheel",
  plinko = "plinko",
  limbo = "limbo",
  keno = "keno",
  roulette1 = "roulette1",
  roulette2 = "roulette2",
  mines = "mines",
}

export const generateGameResult = (
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  gameType: GameType,
) => {
  const hash = generateGameHash(serverSeed, clientSeed, nonce);

  switch (gameType) {
    case GameType.dice:
      return (parseInt(hash.slice(0, 4), 16) % 6) + 1;
    case GameType.coin:
      const temp = (parseInt(hash.slice(0, 4), 16) % 100) + 1;
      return temp % 2 === 0 ? 1 : 2;
    case GameType.dice2:
      return ((parseInt(hash.slice(0, 4), 16) % 10000) + 1) / 100;
    case GameType.wheel:
    case GameType.limbo:
      return (parseInt(hash.slice(0, 4), 16) % 100) + 1;
    case GameType.plinko:
      return parseInt(hash.slice(0, 4), 16);
    case GameType.keno: {
      let generatedNumbers = new Set<number>();
      let start = 0;
      while (generatedNumbers.size < 10) {
        let num = (parseInt(hash.slice(start * 2, start * 2 + 2), 16) % 40) + 1;
        generatedNumbers.add(num);
        start++;
      }
      return Array.from(generatedNumbers);
    }
    case GameType.roulette1:
      return parseInt(hash.slice(0, 4), 16) % 37;
    case GameType.roulette2:
      return (parseInt(hash.slice(0, 4), 16) % 38) - 1;
    case GameType.mines: {
      let x = 5;
      // in a 5x5 grid, fill 25 cells with 0s and 1s, there should be x number of 1s
      let mineGrid = new Array(25).fill(0);
      for (let i = 0; i < x; i++) {
        mineGrid[i] = 1;
      }
      // shuffle the array
      for (let i = mineGrid.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mineGrid[i], mineGrid[j]] = [mineGrid[j], mineGrid[i]];
      }
      return mineGrid;
      
    }
    default:
      throw new Error("Invalid game type!");
  }
};

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
  hilo = "hilo",
}

type GameResult<T extends GameType> = T extends
  | GameType.hilo
  | GameType.mines
  | GameType.keno
  ? number[]
  : number;

export const generateGameResult = <T extends GameType>(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  gameType: T,
  parameter?: number,
): GameResult<T> => {
  const hash = generateGameHash(serverSeed, clientSeed, nonce);

  switch (gameType) {
    case GameType.dice:
      return ((parseInt(hash.slice(0, 4), 16) % 6) + 1) as GameResult<T>;

    case GameType.coin:
      const temp = (parseInt(hash.slice(0, 4), 16) % 100) + 1;
      return (temp % 2 === 0 ? 1 : 2) as GameResult<T>;

    case GameType.dice2:
    case GameType.limbo:
      return (((parseInt(hash.slice(0, 4), 16) % 10000) + 1) /
        100) as GameResult<T>;

    case GameType.wheel:
      return ((parseInt(hash.slice(0, 4), 16) % 100) + 1) as GameResult<T>;

    case GameType.plinko: {
      if (!parameter) throw new Error("Game parameter missing!");

      return ((parseInt(hash.slice(0, 4), 16) % Math.pow(2, parameter)) +
        1) as GameResult<T>;
    }

    case GameType.keno: {
      let generatedNumbers = new Set<number>();
      let start = 0;
      while (generatedNumbers.size < 10) {
        let num = (parseInt(hash.slice(start * 2, start * 2 + 2), 16) % 40) + 1;
        generatedNumbers.add(num);
        start++;
      }
      return Array.from(generatedNumbers) as GameResult<T>;
    }

    case GameType.roulette1:
      return (parseInt(hash.slice(0, 4), 16) % 37) as GameResult<T>;

    case GameType.roulette2:
      return ((parseInt(hash.slice(0, 4), 16) % 38) - 1) as GameResult<T>;

    case GameType.mines: {
      if (!parameter) throw new Error("Game parameter missing!");
      let mines = Array.from({ length: 25 }, () => 0);

      for (let minesCount = 0; minesCount < parameter; minesCount++) {
        let mineIndex =
          parseInt(hash.slice(minesCount * 2, minesCount * 2 + 2), 16) % 25;

        while (mines[mineIndex] === 1) {
          mineIndex = (mineIndex + 1) % 25;
        }
        mines[mineIndex] = 1;
      }

      return mines as GameResult<T>;
    }

    case GameType.hilo: {
      if (!parameter) throw new Error("Game parameter missing!");

      let numbers = [parameter];
      console.log(hash);
      const reversedHash = hash.split("").reverse().join("");

      let combinedHash = "";
      for (let i = 0; i < hash.length; i += 2) {
        combinedHash += hash.substring(i, i + 2);
        combinedHash += reversedHash.substring(i, i + 2);
      }

      for (let i = 0; i < 51; i++) {
        let currentNum =
          (parseInt(combinedHash.slice(i * 2, i * 2 + 2), 16) % 52) + 1;

        while (numbers.includes(currentNum)) {
          currentNum = (currentNum % 52) + 1;
        }
        numbers.push(currentNum);
      }

      return numbers as GameResult<T>;
    }

    default:
      throw new Error("Invalid game type!");
  }
};

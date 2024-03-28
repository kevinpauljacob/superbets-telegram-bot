import * as crypto from "crypto";

// Before the game round:
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

export enum GameType {
  dice = "dice",
  coin = "coin",
  dice2 = "dice2",
  wheel = "wheel",
  plinko = "plinko",
  limbo = "limbo",
  keno = "keno",
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
    case GameType.dice2:
      return (parseInt(hash.slice(0, 4), 16) % 6) + 1;
    case GameType.coin:
    case GameType.wheel:
    case GameType.limbo:
      return (parseInt(hash.slice(0, 4), 16) % 100) + 1;
    case GameType.plinko:
      return parseInt(hash.slice(0, 4), 16);
    case GameType.keno:
      let generatedNumbers = new Set<number>();
      let start = 0;
      while (generatedNumbers.size < 10) {
        let num = (parseInt(hash.slice(start * 2, start * 2 + 2), 16) % 40) + 1;
        generatedNumbers.add(num);
        start++;
      }
      return Array.from(generatedNumbers);
    default:
      throw new Error("Invalid game type!");
  }
};

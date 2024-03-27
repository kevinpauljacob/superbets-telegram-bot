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
      return parseFloat(
        (100 / (parseInt(hash.slice(0, 4), 16) % 100) + 1).toFixed(2),
      );
    default:
      throw new Error("Invalid game type!");
  }
};

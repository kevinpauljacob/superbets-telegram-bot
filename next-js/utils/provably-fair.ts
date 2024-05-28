import crypto from "crypto";
import Decimal from "decimal.js";

// Before the game round:
export const generateClientSeed = () => {
  return crypto.randomBytes(8).toString("hex");
};

export const generateServerSeed = (encryptionKey: Buffer) => {
  const serverSeed = crypto.randomBytes(32).toString("hex");
  const serverSeedHash = crypto
    .createHash("sha256")
    .update(serverSeed)
    .digest("hex");

  const iv = generateIV();
  const encryptedServerSeed = encryptServerSeed(serverSeed, encryptionKey, iv);

  return { serverSeed, serverSeedHash, iv, encryptedServerSeed };
};

// Generate a random encryption key and IV (ensure secure storage of the key)
const encryptionKey = crypto.randomBytes(32); // 32 bytes for AES-256
const generateIV = () => crypto.randomBytes(16); // 16 bytes for AES

// Encrypt the serverSeed
const encryptServerSeed = (
  serverSeed: string,
  key: Buffer,
  iv: Buffer,
) => {
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(serverSeed, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
};

// Decrypt the serverSeed
export const decryptServerSeed = (
  encryptedServerSeed: string,
  key: Buffer,
  iv: Buffer,
) => {
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedServerSeed, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

interface SeedData {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  cursor: number;
  count: number;
}

// Function to generate the HMAC-based pseudorandom number generator
function* hmacGenerator({
  serverSeed,
  clientSeed,
  nonce,
  cursor,
}: Omit<SeedData, "count">) {
  let blockIndex = Math.floor(cursor / 32);
  let byteIndex = cursor % 32;

  while (true) {
    const hmac = crypto.createHmac("sha256", serverSeed);
    hmac.update(`${clientSeed}:${nonce}:${blockIndex}`);
    const digest = hmac.digest();

    while (byteIndex < 32) {
      yield digest[byteIndex];
      byteIndex += 1;
    }

    byteIndex = 0;
    blockIndex += 1;
  }
}

// Function to get the final values from the pseudorandom number generator
function getFinalValues(seedData: SeedData): number[] {
  const generator = hmacGenerator(seedData);
  const values: number[] = [];

  while (values.length < 4 * seedData.count) {
    values.push(generator.next().value as number);
  }

  return chunk(values, 4).map((chunk) =>
    chunk.reduce((sum, byte, index) => sum + byte / 256 ** (index + 1), 0),
  );
}

// Helper function to chunk an array
function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

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
  switch (gameType) {
    case GameType.dice: {
      let n = getFinalValues({
        serverSeed,
        clientSeed,
        nonce,
        cursor: 0,
        count: 1,
      }).map((e) => Math.floor(6 * e) + 1);

      return n[0] as GameResult<T>;
    }

    case GameType.coin: {
      let n = getFinalValues({
        serverSeed,
        clientSeed,
        nonce,
        cursor: 0,
        count: 1,
      }).map((e) => Math.floor(2 * e) + 1);

      return n[0] as GameResult<T>;
    }

    case GameType.dice2: {
      let n = getFinalValues({
        serverSeed,
        clientSeed,
        nonce,
        cursor: 0,
        count: 1,
      }).map((e) => Math.floor(10001 * e) / 100);
      const r = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 })
        .format(n[0])
        .replace(",", ".");

      return parseFloat(r) as GameResult<T>;
    }

    case GameType.limbo: {
      let a = getFinalValues({
        serverSeed,
        clientSeed,
        nonce,
        cursor: 0,
        count: 1,
      });

      const result = Decimal.min(
        new Decimal(1)
          .times(16777216)
          .dividedBy(new Decimal(16777216).times(a[0] ?? 0).plus(1)),
        1e6,
      ).toFixed(2, Decimal.ROUND_DOWN);

      return parseFloat(result) as GameResult<T>;
    }

    case GameType.wheel: {
      let n = getFinalValues({
        serverSeed,
        clientSeed,
        nonce,
        cursor: 0,
        count: 1,
      }).map((e) => Math.floor(100 * e) + 1);

      return n[0] as GameResult<T>;
    }

    case GameType.keno: {
      let n = getFinalValues({
        serverSeed,
        clientSeed,
        nonce,
        cursor: 0,
        count: 10,
      }).map((e, t) => Math.ceil(e * (40 - t)));
      const a: Array<number> = [];
      for (let e of n) {
        let t = e,
          l = 0;
        for (; l <= t; ) a.includes(l) && t++, l++;
        a.push(t);
      }

      return a as GameResult<T>;
    }

    //TODO: correct these
    case GameType.plinko: {
      if (!parameter) throw new Error("Game parameter missing!");

      let n = getFinalValues({
        serverSeed,
        clientSeed,
        nonce,
        cursor: 0,
        count: 1,
      }).map((e) => Math.floor(parameter * e) + 1);

      return n[0] as GameResult<T>;
    }

    case GameType.roulette1: {
      let n = getFinalValues({
        serverSeed,
        clientSeed,
        nonce,
        cursor: 0,
        count: 1,
      }).map((e) => Math.floor(37 * e));

      return n[0] as GameResult<T>;
    }

    case GameType.roulette2: {
      let n = getFinalValues({
        serverSeed,
        clientSeed,
        nonce,
        cursor: 0,
        count: 1,
      }).map((e) => Math.floor(37 * e) - 1);

      return n[0] as GameResult<T>;
    }

    case GameType.mines: {
      if (!parameter) throw new Error("Game parameter missing!");
      let o = getFinalValues({
        serverSeed,
        clientSeed,
        nonce,
        cursor: 0,
        count: parameter,
      }).map((e, t) => Math.floor(e * (25 - t)));

      const i: Array<number> = [];

      for (let e of o) {
        let t = e,
          l = 0;
        for (; l <= t; ) i.includes(l) && t++, l++;
        i.push(t);
      }

      const mines = Array(25).map((_, index) => (i.includes(index) ? 1 : 0));

      return mines as GameResult<T>;
    }

    // case GameType.hilo: {
    //   if (!parameter) throw new Error("Game parameter missing!");

    //   let numbers = [parameter];

    //   const reversedHash = hash.split("").reverse().join("");

    //   let combinedHash = "";
    //   for (let i = 0; i < hash.length; i += 2) {
    //     combinedHash += hash.substring(i, i + 2);
    //     combinedHash += reversedHash.substring(i, i + 2);
    //   }

    //   for (let i = 0; i < 51; i++) {
    //     let currentNum =
    //       (parseInt(combinedHash.slice(i * 2, i * 2 + 2), 16) % 52) + 1;

    //     while (numbers.includes(currentNum)) {
    //       currentNum = (currentNum % 52) + 1;
    //     }
    //     numbers.push(currentNum);
    //   }

    //   return numbers as GameResult<T>;
    // }

    default:
      throw new Error("Invalid game type!");
  }
};

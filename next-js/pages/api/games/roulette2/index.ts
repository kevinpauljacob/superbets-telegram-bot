import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { GameSeed, Roulette2, User } from "@/models/games";
import {
  generateGameResult,
  GameType,
  seedStatus,
} from "@/utils/provably-fair";
import StakingUser from "@/models/staking/user";
import {
  houseEdgeTiers,
  launchPromoEdge,
  pointTiers,
} from "@/context/transactions";
import { wsEndpoint } from "@/context/gameTransactions";
import { Decimal } from "decimal.js";
Decimal.set({ precision: 9 });

const secret = process.env.NEXTAUTH_SECRET;

export const config = {
  maxDuration: 60,
};

type WagerType =
  | "red"
  | "black"
  | "green"
  | "odd"
  | "even"
  | "low"
  | "high"
  | "1st-12"
  | "2nd-12"
  | "3rd-12"
  | "1st-column"
  | "2nd-column"
  | "3rd-column"
  | "straight";

const WagerMapping: Record<WagerType, Array<number> | Record<string, number>> =
  {
    red: [1, 3, 5, 7, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36],
    black: [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35],
    green: [-1, 0],
    odd: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35],
    even: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36],
    low: [...Array(18).keys()].map((x) => x + 1),
    high: [...Array(18).keys()].map((x) => x + 19),
    "1st-12": [...Array(12).keys()].map((x) => x + 1),
    "2nd-12": [...Array(12).keys()].map((x) => x + 13),
    "3rd-12": [...Array(12).keys()].map((x) => x + 25),
    "1st-column": [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
    "2nd-column": [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
    "3rd-column": [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
    straight: {
      "0": 0,
      "1": 1,
      "2": 2,
      "3": 3,
      "4": 4,
      "5": 5,
      "6": 6,
      "7": 7,
      "8": 8,
      "9": 9,
      "10": 10,
      "11": 11,
      "12": 12,
      "13": 13,
      "14": 14,
      "15": 15,
      "16": 16,
      "17": 17,
      "18": 18,
      "19": 19,
      "20": 20,
      "21": 21,
      "22": 22,
      "23": 23,
      "24": 24,
      "25": 25,
      "26": 26,
      "27": 27,
      "28": 28,
      "29": 29,
      "30": 30,
      "31": 31,
      "32": 32,
      "33": 33,
      "34": 34,
      "35": 35,
      "36": 36,
    },
  };

const WagerPayout: Record<WagerType, number> = {
  red: 2,
  black: 2,
  green: 36,
  odd: 2,
  even: 2,
  low: 2,
  high: 2,
  "1st-12": 3,
  "2nd-12": 3,
  "3rd-12": 3,
  "1st-column": 3,
  "2nd-column": 3,
  "3rd-column": 3,
  straight: 36,
};

type Wager = Record<string, number | Record<string, number>>;

type InputType = {
  wallet: string;
  tokenMint: string;
  wager: Wager;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, tokenMint, wager }: InputType = req.body;

      const token = await getToken({ req, secret });

      if (!token || !token.sub || token.sub != wallet)
        return res.status(400).json({
          success: false,
          message: "User wallet not authenticated",
        });

      await connectDatabase();

      if (!wallet || !tokenMint || !wager)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      if (
        tokenMint !== "SOL" ||
        !Object.keys(wager).every((key) => WagerMapping[key as WagerType])
      )
        return res
          .status(400)
          .json({ success: false, message: "Invalid parameters" });

      let user = await User.findOne({ wallet });

      if (!user)
        return res
          .status(400)
          .json({ success: false, message: "User does not exist !" });

      const amount = Object.entries(wager)
        .reduce((acc, next) => {
          if (next[0] === "straight") {
            const straightTotal = Object.values(
              next[1] as Record<string, number>,
            ).reduce((acc, next) => acc.add(next), new Decimal(0));

            return acc.add(straightTotal);
          } else {
            return acc.add(next[1] as number);
          }
        }, new Decimal(0))
        .toNumber();

      if (
        user.deposit.find((d: any) => d.tokenMint === tokenMint)?.amount <
        amount
      )
        return res
          .status(400)
          .json({ success: false, message: "Insufficient balance !" });

      const userData = await StakingUser.findOneAndUpdate(
        { wallet },
        {},
        { upsert: true, new: true },
      );
      const userTier = userData?.tier ?? 0;
      const houseEdge = launchPromoEdge ? 0 : houseEdgeTiers[userTier];

      const activeGameSeed = await GameSeed.findOneAndUpdate(
        {
          wallet,
          status: seedStatus.ACTIVE,
        },
        {
          $inc: {
            nonce: 1,
          },
        },
        { new: true },
      );

      if (!activeGameSeed) {
        throw new Error("Server hash not found!");
      }

      const { serverSeed, clientSeed, nonce } = activeGameSeed;

      const strikeNumber = generateGameResult(
        serverSeed,
        clientSeed,
        nonce,
        GameType.roulette2,
      );

      if (strikeNumber == null) throw new Error("Invalid strike number!");

      let amountWon = new Decimal(0);
      let result = "Lost";

      Object.entries(wager).forEach(([key, value]) => {
        if (key === "straight") {
          if (
            (value as Record<string, number>)[strikeNumber.toString()] != null
          ) {
            amountWon = amountWon.add(
              Decimal.mul(
                (value as Record<string, number>)[strikeNumber.toString()],
                WagerPayout[key],
              ),
            );
            result = "Won";
          }
        } else if (
          (WagerMapping[key as WagerType] as Array<number>).includes(
            strikeNumber,
          )
        ) {
          amountWon = amountWon.add(
            Decimal.mul(value as number, WagerPayout[key as WagerType]),
          );
          result = "Won";
        }
      });

      amountWon = amountWon.mul(Decimal.sub(1, houseEdge));
      const amountLost = Math.max(Decimal.sub(amount, amountWon).toNumber(), 0);

      const userUpdate = await User.findOneAndUpdate(
        {
          wallet,
          deposit: {
            $elemMatch: {
              tokenMint,
              amount: { $gte: amount },
            },
          },
        },
        {
          $inc: {
            "deposit.$.amount": amountWon.sub(amount),
            numOfGamesPlayed: 1,
          },
        },
        {
          new: true,
        },
      );

      if (!userUpdate) {
        throw new Error("Insufficient balance for action!!");
      }

      await Roulette2.create({
        wallet,
        amount,
        wager,
        strikeNumber,
        result,
        tokenMint,
        houseEdge,
        amountWon,
        amountLost,
        nonce,
        gameSeed: activeGameSeed._id,
      });

      const pointsGained =
        0 * user.numOfGamesPlayed + 1.4 * amount * userData.multiplier;

      const points = userData.points + pointsGained;
      const newTier = Object.entries(pointTiers).reduce((prev, next) => {
        return points >= next[1]?.limit ? next : prev;
      })[0];

      await StakingUser.findOneAndUpdate(
        {
          wallet,
        },
        {
          $inc: {
            points: pointsGained,
          },
          $set: {
            tier: newTier,
          },
        },
      );

      const socket = new WebSocket(wsEndpoint);

      socket.onopen = () => {
        socket.send(
          JSON.stringify({
            clientType: "api-client",
            channel: "fomo-casino_games-channel",
            authKey: process.env.FOMO_CHANNEL_AUTH_KEY!,
            payload: {
              game: GameType.roulette2,
              wallet,
              result,
              userTier,
              time: new Date(),
              //TODO:
              strikeMultiplier: 1,
              amount,
              amountWon: amountWon.toNumber(),
            },
          }),
        );

        socket.close();
      };

      return res.status(201).json({
        success: true,
        message:
          result === "Won"
            ? `Congratulations! You Won ${amountWon}`
            : "Better luck next time!",
        strikeNumber,
        amountWon,
        amountLost,
      });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  } else {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }
}

export default handler;

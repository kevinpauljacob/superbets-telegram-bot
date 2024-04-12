import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { GameSeed, Roulette1, User } from "@/models/games";
import { generateGameResult, GameType, seedStatus } from "@/utils/vrf";
import StakingUser from "@/models/staking/user";
import { pointTiers } from "@/context/transactions";
import { wsEndpoint } from "@/context/gameTransactions";

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
    green: [0],
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
  amount: number;
  tokenMint: string;
  wager: Wager;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, amount, tokenMint, wager }: InputType = req.body;

      const token = await getToken({ req, secret });

      if (!token || !token.sub || token.sub != wallet)
        return res.status(400).json({
          success: false,
          message: "User wallet not authenticated",
        });

      await connectDatabase();

      if (!wallet || !amount || !tokenMint || !wager)
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

      if (
        user.deposit.find((d: any) => d.tokenMint === tokenMint)?.amount <
        amount
      )
        return res
          .status(400)
          .json({ success: false, message: "Insufficient balance !" });

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
        GameType.plinko,
      ) as number;

      if (strikeNumber == null) throw new Error("Invalid strike number!");

      let amountWon = 0;
      let result = "Lost";

      Object.entries(wager).forEach(([key, value]) => {
        if (key === "straight") {
          if (
            (value as Record<string, number>)[strikeNumber.toString()] != null
          ) {
            amountWon += amount * WagerPayout[key];
            result = "Won";
          }
        } else if (
          (WagerMapping[key as WagerType] as Array<number>).includes(
            strikeNumber,
          )
        ) {
          amountWon += amount * WagerPayout[key as WagerType];
          result = "Won";
        }
      });

      const amountLost = Math.max(amount - amountWon, 0);

      let sns;

      if (!user.sns) {
        sns = (
          await fetch(
            `https://sns-api.bonfida.com/owners/${wallet}/domains`,
          ).then((data) => data.json())
        ).result[0];
        if (sns) sns = sns + ".sol";
      }

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
            "deposit.$.amount": -amount + amountWon,
          },
          sns,
        },
        {
          new: true,
        },
      );

      if (!userUpdate) {
        throw new Error("Insufficient balance for action!!");
      }

      await Roulette1.create({
        wallet,
        amount,
        wager,
        strikeNumber,
        result,
        tokenMint,
        amountWon,
        amountLost,
        nonce,
        gameSeed: activeGameSeed._id,
      });

      if (result === "Won") {
        const userData = await StakingUser.findOne({ wallet });
        let points = userData?.points ?? 0;
        const userTier = Object.entries(pointTiers).reduce((prev, next) => {
          return points >= next[1]?.limit ? next : prev;
        })[0];

        const socket = new WebSocket(wsEndpoint);

        socket.onopen = () => {
          console.log("WebSocket connection opened");
          socket.send(
            JSON.stringify({
              clientType: "api-client",
              channel: "fomo-casino_games-channel",
              authKey: process.env.FOMO_CHANNEL_AUTH_KEY!,
              payload: {
                game: GameType.roulette1,
                wallet,
                absAmount: Math.abs(amountWon - amountLost),
                result,
                userTier,
              },
            }),
          );

          socket.close();
        };
      }

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

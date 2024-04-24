import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { GameSeed, Keno, User } from "@/models/games";
import {
  generateGameResult,
  GameType,
  seedStatus,
} from "@/utils/provably-fair";
import StakingUser from "@/models/staking/user";
import { pointTiers } from "@/context/transactions";
import { minGameAmount, wsEndpoint } from "@/context/gameTransactions";
import { Decimal } from "decimal.js";
Decimal.set({ precision: 9 });

const secret = process.env.NEXTAUTH_SECRET;

export const config = {
  maxDuration: 60,
};

type InputType = {
  wallet: string;
  amount: number;
  tokenMint: string;
  chosenNumbers: number[];
  risk: "classic" | "low" | "medium" | "high";
};

type RiskToChance = Record<string, Record<number, Array<number>>>;

export const riskToChance: RiskToChance = {
  classic: {
    1: [0.0, 3.96],
    2: [0.0, 1.9, 4.5],
    3: [0.0, 1.0, 3.1, 10.4],
    4: [0.0, 0.8, 1.8, 5.0, 22.5],
    5: [0.0, 0.25, 1.4, 4.1, 16.5, 36.0],
    6: [0.0, 0.0, 1.0, 2.68, 7.0, 16.5, 40.0],
    7: [0.0, 0.0, 0.47, 3.0, 4.5, 14.0, 31.0, 60.0],
    8: [0.0, 0.0, 0.0, 2.2, 4.0, 13.0, 22.0, 55.0, 70.0],
    9: [0.0, 0.0, 0.0, 1.55, 3.0, 8.0, 15.0, 44.0, 60.0, 85.0],
    10: [0.0, 0.0, 0.0, 1.4, 2.25, 4.5, 8.0, 17.0, 50.0, 80.0, 100.0],
  },
  low: {
    1: [0.0, 1.85],
    2: [0.0, 2.0, 3.8],
    3: [0.0, 1.1, 1.38, 26.0],
    4: [0.0, 0.0, 2.2, 7.9, 90.0],
    5: [0.0, 0.0, 1.5, 4.2, 13.0, 300.0],
    6: [0.0, 0.0, 1.1, 2.0, 6.2, 100.0, 700.0],
    7: [0.0, 0.0, 1.1, 1.6, 3.5, 15.0, 225.0, 700.0],
    8: [0.0, 0.0, 1.1, 1.5, 2.0, 5.5, 39.0, 100.0, 800.0],
    9: [0.0, 0.0, 1.1, 1.3, 1.7, 2.5, 7.5, 50.0, 250.0, 1000.0],
    10: [0.0, 0.0, 1.1, 1.2, 1.3, 1.8, 3.5, 13.0, 50.0, 250.0, 1000.0],
  },
  medium: {
    1: [0.4, 2.75],
    2: [0.0, 1.8, 5.1],
    3: [0.0, 0.0, 2.8, 50.0],
    4: [0.0, 0.0, 1.7, 10.0, 100.0],
    5: [0.0, 0.0, 1.4, 4.0, 14.0, 390.0],
    6: [0.0, 0.0, 0.0, 3.0, 9.0, 180.0, 710.0],
    7: [0.0, 0.0, 0.0, 2.0, 7.0, 30.0, 400.0, 800.0],
    8: [0.0, 0.0, 0.0, 1.0, 4.0, 11.0, 67.0, 400.0, 900.0],
    9: [0.0, 0.0, 0.0, 2.0, 2.5, 5.0, 15.0, 100.0, 500.0, 1000.0],
    10: [0.0, 0.0, 0.0, 1.6, 2.0, 4.0, 7.0, 26.0, 100.0, 500.0, 1000.0],
  },
  high: {
    1: [0.0, 3.96],
    2: [0.0, 0.0, 17.1],
    3: [0.0, 0.0, 0.0, 81.5],
    4: [0.0, 0.0, 0.0, 10.0, 259.0],
    5: [0.0, 0.0, 0.0, 4.5, 48.0, 450.0],
    6: [0.0, 0.0, 0.0, 0.0, 11.0, 350.0, 710.0],
    7: [0.0, 0.0, 0.0, 0.0, 7.0, 90.0, 400.0, 800.0],
    8: [0.0, 0.0, 0.0, 0.0, 5.0, 20.0, 270.0, 600.0, 900.0],
    9: [0.0, 0.0, 0.0, 0.0, 4.0, 11.0, 56.0, 500.0, 800.0, 1000.0],
    10: [0.0, 0.0, 0.0, 0.0, 3.5, 8.0, 13.0, 3.0, 500.0, 800.0, 1000.0],
  },
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, amount, tokenMint, chosenNumbers, risk }: InputType =
        req.body;

      const token = await getToken({ req, secret });

      if (!token || !token.sub || token.sub != wallet)
        return res.status(400).json({
          success: false,
          message: "User wallet not authenticated",
        });

      if (!wallet || !amount || !tokenMint || !chosenNumbers || !risk)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      if (amount < minGameAmount)
        return res.status(400).json({
          success: false,
          message: "Invalid bet amount",
        });

      if (
        tokenMint !== "SOL" ||
        !(
          1 <= chosenNumbers.length &&
          chosenNumbers.length <= 10 &&
          chosenNumbers.every((n) => 1 <= n && n <= 40 && n % 10 === 0)
        ) ||
        !(
          risk === "classic" ||
          risk === "low" ||
          risk === "medium" ||
          risk === "high"
        )
      )
        return res
          .status(400)
          .json({ success: false, message: "Invalid parameters" });

      await connectDatabase();

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

      const strikeNumbers = generateGameResult(
        serverSeed,
        clientSeed,
        nonce,
        GameType.keno,
      );

      if (!strikeNumbers) throw new Error("Invalid strike number!");

      const multiplier = riskToChance[risk][chosenNumbers.length];

      //find the number of matches in strikeNumbers and chosenNumbers
      let matches = 0;
      chosenNumbers.forEach((number) => {
        if (strikeNumbers.includes(number)) {
          matches++;
        }
      });
      const strikeMultiplier = multiplier[matches];
      const amountWon = new Decimal(amount).mul(strikeMultiplier);
      const amountLost = Math.max(
        new Decimal(amount).sub(amountWon).toNumber(),
        0,
      );

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
          },
        },
        {
          new: true,
        },
      );

      if (!userUpdate) {
        throw new Error("Insufficient balance for action!!");
      }

      const result = amountWon.toNumber() > amount ? "Won" : "Lost";
      await Keno.create({
        wallet,
        amount,
        chosenNumbers,
        risk,
        strikeNumbers,
        strikeMultiplier,
        tokenMint,
        result,
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
          socket.send(
            JSON.stringify({
              clientType: "api-client",
              channel: "fomo-casino_games-channel",
              authKey: process.env.FOMO_CHANNEL_AUTH_KEY!,
              payload: {
                game: GameType.keno,
                wallet,
                absAmount: amountWon.sub(amount).toNumber(),
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
        message: `Congratulations! You won ${amountWon}!`,
        strikeNumbers,
        strikeMultiplier,
        amountWon: amountWon.toNumber(),
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

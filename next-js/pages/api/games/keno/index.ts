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
import { riskToChance } from "@/components/games/Keno/RiskToChance";
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

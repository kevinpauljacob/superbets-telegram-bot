import connectDatabase from "../../../../utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { wsEndpoint, minGameAmount } from "@/context/gameTransactions";
import { Coin, GameSeed, User } from "@/models/games";
import {
  GameType,
  generateGameResult,
  seedStatus,
} from "@/utils/provably-fair";
import StakingUser from "@/models/staking/user";
import { pointTiers } from "@/context/transactions";
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
  flipType: "heads" | "tails";
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, amount, tokenMint, flipType }: InputType = req.body;

      const token = await getToken({ req, secret });

      if (!token || !token.sub || token.sub != wallet)
        return res.status(400).json({
          success: false,
          message: "User wallet not authenticated",
        });

      if (amount < minGameAmount)
        return res.status(400).json({
          success: false,
          message: "Invalid bet amount",
        });

      if (
        !wallet ||
        !amount ||
        tokenMint !== "SOL" ||
        !(flipType === "heads" || flipType === "tails")
      )
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

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

      const strikeNumber = generateGameResult(
        serverSeed,
        clientSeed,
        nonce,
        GameType.coin,
      );

      let result = "Lost";
      let amountWon = new Decimal(0);
      let amountLost = amount;
      const strikeMultiplier = 2;

      if (
        (flipType === "heads" && strikeNumber === 1) ||
        (flipType === "tails" && strikeNumber === 2)
      ) {
        result = "Won";
        amountWon = Decimal.mul(amount, strikeMultiplier);
        amountLost = 0;
      }

      const userUpdate = await User.findOneAndUpdate(
        {
          wallet,
          deposit: {
            $elemMatch: {
              tokenMint: tokenMint,
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
        throw new Error("Insufficient balance for bet!");
      }

      await Coin.create({
        wallet,
        amount,
        flipType,
        strikeNumber,
        strikeMultiplier,
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
          socket.send(
            JSON.stringify({
              clientType: "api-client",
              channel: "fomo-casino_games-channel",
              authKey: process.env.FOMO_CHANNEL_AUTH_KEY!,
              payload: {
                game: GameType.coin,
                wallet,
                absAmount: amountWon.sub(amountLost).abs().toNumber(),
                result,
                userTier,
              },
            }),
          );

          socket.close();
        };
      }

      return res.json({
        success: true,
        data: { strikeNumber, result },
        message: result == "Won" ? "You won !" : "You lost !",
      });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  } else
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
}

export default handler;

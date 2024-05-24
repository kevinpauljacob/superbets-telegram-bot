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
import {
  houseEdgeTiers,
  launchPromoEdge,
  maxPayouts,
  pointTiers,
} from "@/context/transactions";
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

      const strikeMultiplier = 2;
      const maxPayout = Decimal.mul(amount, strikeMultiplier);

      if (!(maxPayout.toNumber() <= maxPayouts.coinflip))
        return res
          .status(400)
          .json({ success: false, message: "Max payout exceeded" });

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
        GameType.coin,
      );

      let result = "Lost";
      let amountWon = new Decimal(0);
      let amountLost = amount;

      if (
        (flipType === "heads" && strikeNumber === 1) ||
        (flipType === "tails" && strikeNumber === 2)
      ) {
        result = "Won";
        amountWon = Decimal.mul(amount, strikeMultiplier).mul(
          Decimal.sub(1, houseEdge),
        );
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
            numOfGamesPlayed: 1,
          },
        },
        {
          new: true,
        },
      );

      if (!userUpdate) {
        throw new Error("Insufficient balance for bet!");
      }

      const coin = new Coin({
        wallet,
        amount,
        flipType,
        strikeNumber,
        strikeMultiplier,
        result,
        tokenMint,
        houseEdge,
        amountWon,
        amountLost,
        nonce,
        gameSeed: activeGameSeed._id,
      });
      await coin.save();

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

      const record = await Coin.populate(coin, "gameSeed");
      const { gameSeed, ...rest } = record.toObject();
      rest.game = GameType.coin;
      rest.userTier = parseInt(newTier);
      rest.gameSeed = { ...gameSeed, serverSeed: undefined };

      const payload = rest;

      const socket = new WebSocket(wsEndpoint);

      socket.onopen = () => {
        socket.send(
          JSON.stringify({
            clientType: "api-client",
            channel: "fomo-casino_games-channel",
            authKey: process.env.FOMO_CHANNEL_AUTH_KEY!,
            payload,
          }),
        );

        socket.close();
      };

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

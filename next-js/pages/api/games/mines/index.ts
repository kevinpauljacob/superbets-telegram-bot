import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { GameSeed, Mines, User } from "@/models/games";
import { GameTokens, GameType, seedStatus } from "@/utils/provably-fair";
import { minGameAmount, wsEndpoint } from "@/context/gameTransactions";
import Decimal from "decimal.js";
import { maxPayouts } from "@/context/transactions";
import StakingUser from "@/models/staking/user";
import { SPL_TOKENS } from "@/context/config";
import updateGameStats from "../global/updateGameStats";

const secret = process.env.NEXTAUTH_SECRET;

export const config = {
  maxDuration: 60,
};

type InputType = {
  wallet: string;
  amount: number;
  tokenMint: string;
  minesCount: number;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, amount, tokenMint, minesCount }: InputType = req.body;

      const token = await getToken({ req, secret });

      if (!token || !token.sub || token.sub != wallet)
        return res.status(400).json({
          success: false,
          message: "User wallet not authenticated",
        });

      if (!wallet || !amount || !tokenMint || !minesCount)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      const splToken = SPL_TOKENS.find((t) => t.tokenMint === tokenMint);
      if (
        typeof amount !== "number" ||
        !isFinite(amount) ||
        !splToken ||
        !(Number.isInteger(minesCount) && 1 <= minesCount && minesCount <= 24)
      )
        return res
          .status(400)
          .json({ success: false, message: "Invalid parameters" });

      if (amount < minGameAmount)
        return res.status(400).json({
          success: false,
          message: "Invalid bet amount",
        });

      const maxStrikeMultiplier = 25;

      const maxPayout = Decimal.mul(amount, maxStrikeMultiplier);

      if (!(maxPayout.toNumber() <= maxPayouts[tokenMint as GameTokens].mines))
        return res
          .status(400)
          .json({ success: false, message: "Max payout exceeded" });

      await connectDatabase();

      const user = await User.findOne({ wallet });
      const addGame = !user.gamesPlayed.includes(GameType.mines);

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
            "deposit.$.amount": -amount,
            numOfGamesPlayed: 1,
          },
          ...(addGame ? { $addToSet: { gamesPlayed: GameType.mines } } : {}),
        },
        {
          new: true,
        },
      );

      if (!userUpdate) {
        throw new Error("Insufficient balance for action!!");
      }

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

      const { nonce } = activeGameSeed;

      let result = "Pending";

      const minesGame = await Mines.findOneAndUpdate(
        { wallet, result },
        {
          $setOnInsert: {
            wallet,
            amount,
            minesCount,
            strikeMultiplier: 1,
            result,
            tokenMint,
            amountWon: 0,
            amountLost: 0,
            nonce,
            gameSeed: activeGameSeed._id,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      await updateGameStats(GameType.mines, tokenMint, amount, addGame, 0);

      const userData = await StakingUser.findOneAndUpdate(
        { wallet },
        {},
        { upsert: true, new: true },
      );
      const userTier = userData?.tier ?? 0;

      const rest = minesGame.toObject();
      rest.game = GameType.mines;
      rest.userTier = userTier;

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

      return res.status(201).json({
        success: true,
        gameId: minesGame._id,
        message: "Mines game created",
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

import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { GameSeed, Mines, User } from "@/models/games";
import { GameTokens, GameType, seedStatus } from "@/utils/provably-fair";
import { wsEndpoint } from "@/context/config";
import Decimal from "decimal.js";
import { maxPayouts, minAmtFactor, maintainance } from "@/context/config";
import StakingUser from "@/models/staking/user";
import { SPL_TOKENS } from "@/context/config";
import updateGameStats from "../../../../utils/updateGameStats";

const secret = process.env.NEXTAUTH_SECRET;

export const config = {
  maxDuration: 60,
};

type InputType = {
  wallet: string;
  email: string;
  amount: number;
  tokenMint: string;
  minesCount: number;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, email, amount, tokenMint, minesCount }: InputType =
        req.body;

      if (maintainance)
        return res.status(400).json({
          success: false,
          message: "Under maintenance",
        });

      const minGameAmount =
        maxPayouts[tokenMint as GameTokens]["mines" as GameType] * minAmtFactor;

      const token = await getToken({ req, secret });

      if (
        !token ||
        !token.sub ||
        (wallet && token.sub != wallet) ||
        (email && token.email !== email)
      )
        return res.status(400).json({
          success: false,
          message: "User wallet not authenticated",
        });

      if ((!wallet && !email) || !amount || !tokenMint || !minesCount)
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

      let user = await User.findOne({
        $or: [{ wallet: wallet }, { email: email }],
      });

      if (!user)
        return res
          .status(400)
          .json({ success: false, message: "User does not exist!" });

      if (!user.isWeb2User && tokenMint === "WEB2")
        return res
          .status(400)
          .json({ success: false, message: "You cannot bet with this token!" });

      const account = user._id;

      const pendingGame = await Mines.findOne({ account, result: "Pending" });
      if (pendingGame)
        return res.status(400).json({
          success: false,
          message: "You already have a pending game!",
        });

      const addGame = !user.gamesPlayed.includes(GameType.mines);

      const userUpdate = await User.findOneAndUpdate(
        {
          _id: account,
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
          $set: {
            isWeb2User: tokenMint === "WEB2",
          },
        },
        {
          new: true,
        },
      );

      if (!userUpdate) {
        throw new Error("Insufficient balance for bet!");
      }

      const activeGameSeed = await GameSeed.findOneAndUpdate(
        {
          account,
          status: seedStatus.ACTIVE,
          pendingMines: false,
        },
        {
          $inc: {
            nonce: 1,
          },
          $set: {
            pendingMines: true,
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
        { account, result },
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

      await updateGameStats(
        wallet,
        GameType.mines,
        tokenMint,
        amount,
        addGame,
        0,
      );

      let userData;
      if (wallet)
        userData = await StakingUser.findOneAndUpdate(
          { account },
          {},
          { upsert: true, new: true },
        );

      const userTier = userData?.tier ?? 0;

      const rest = minesGame.toObject();
      rest.game = GameType.mines;
      rest.userTier = 0;

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

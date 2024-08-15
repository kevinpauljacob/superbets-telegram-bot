import {
  maintainance,
  maxPayouts,
  minAmtFactor,
  SPL_TOKENS,
  wsEndpoint,
} from "@/context/config";
import { GameSeed, Mines, User } from "@/models/games";
import connectDatabase from "@/utils/database";
import { GameTokens, GameType, seedStatus } from "@/utils/provably-fair";
import { NextApiRequest, NextApiResponse } from "next";
import updateGameStats from "../../../../utils/updateGameStats";
import Decimal from "decimal.js";

/**
 * @swagger
 * /games/mines:
 *   post:
 *     summary: Create a new mines game
 *     description: Creates a new mines game for a user based on their wallet or email.
 *     tags:
 *       - Games
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               wallet:
 *                 type: string
 *                 description: The user's wallet address.
 *               email:
 *                 type: string
 *                 description: The user's email address.
 *               amount:
 *                 type: number
 *                 description: The amount to bet.
 *               tokenMint:
 *                 type: string
 *                 description: The token mint address.
 *               minesCount:
 *                 type: number
 *                 description: The number of mines in the game.
 *             required:
 *               - wallet
 *               - email
 *               - amount
 *               - tokenMint
 *               - minesCount
 *     responses:
 *       201:
 *         description: Mines game created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 gameId:
 *                   type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: User does not exist, invalid parameters, or other client errors.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *     security:
 *       - API_KEY: []
 */

export const config = {
  maxDuration: 60,
};

type InputType = {
  wallet: string;
  email: string;
  amount: number;
  tokenMint: GameTokens;
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
        maxPayouts[tokenMint][GameType.mines] * minAmtFactor;

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

      const maxPayout = new Decimal(maxPayouts[tokenMint].mines);

      const isSuperToken = tokenMint === "SUPER";
      if (!isSuperToken && amount > maxPayout.toNumber())
        return res.status(400).json({
          success: false,
          message: "Bet amount exceeds max payout!",
        });

      await connectDatabase();

      let user = null;
      if (wallet) {
        user = await User.findOne({
          wallet: wallet,
        });
      } else if (email) {
        user = await User.findOne({
          email: email,
        });
      }

      if (!user)
        return res
          .status(400)
          .json({ success: false, message: "User does not exist!" });

      if (!user.isWeb2User && isSuperToken)
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
            isWeb2User: tokenMint === "SUPER",
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
            account,
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
        account,
        GameType.mines,
        tokenMint,
        amount,
        addGame,
        0,
      );

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

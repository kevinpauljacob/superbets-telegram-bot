import {
  maintainance,
  maxPayouts,
  minAmtFactor,
  SPL_TOKENS,
  wsEndpoint,
} from "@/context/config";
import { getSolPrice } from "@/context/transactions";
import { GameTokens, GameType } from "@/utils/provably-fair";
import { Decimal } from "decimal.js";
import { NextApiRequest, NextApiResponse } from "next";
import { Option, User } from "../../../../models/games";
import connectDatabase from "../../../../utils/database";
import updateGameStats from "../../../../utils/updateGameStats";
Decimal.set({ precision: 9 });

/**
 * @swagger
 * /api/games/options:
 *   post:
 *     summary: Create a new bet on options game
 *     description: Create a new bet on the options game where users can bet up or down on the price within a given time frame.
 *     tags:
 *       - Games
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - wallet
 *               - email
 *               - amount
 *               - tokenMint
 *               - betType
 *               - timeFrame
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
 *                 description: The mint address of the token being bet.
 *               betType:
 *                 type: string
 *                 enum: [betUp, betDown]
 *                 description: The type of bet, either 'betUp' or 'betDown'.
 *               timeFrame:
 *                 type: number
 *                 enum: [3, 4, 5]
 *                 description: The timeframe for the bet in minutes.
 *     responses:
 *       200:
 *         description: Bet successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     betTime:
 *                       type: string
 *                       format: date-time
 *                     strikePrice:
 *                       type: number
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request parameters or user-related errors.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       405:
 *         description: Method not allowed.
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
 */

const secret = process.env.NEXTAUTH_SECRET;

export const config = {
  maxDuration: 60,
};

type InputType = {
  wallet: string;
  email: string;
  amount: number;
  tokenMint: string;
  betType: "betUp" | "betDown";
  timeFrame: number;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, email, amount, tokenMint, betType, timeFrame }: InputType =
        req.body;

      const minGameAmount =
        maxPayouts[tokenMint as GameTokens]["options" as GameType] *
        minAmtFactor;

      if (maintainance)
        return res.status(400).json({
          success: false,
          message: "Under maintenance",
        });

      if ((!wallet && !email) || !amount || !tokenMint || !betType)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      const splToken = SPL_TOKENS.find((t) => t.tokenMint === tokenMint);
      if (
        typeof amount !== "number" ||
        !isFinite(amount) ||
        !splToken ||
        !(betType === "betUp" || betType === "betDown")
      )
        return res
          .status(400)
          .json({ success: false, message: "Invalid parameters" });

      if (amount < minGameAmount)
        return res.status(400).json({
          success: false,
          message: "Invalid bet amount",
        });

      if (timeFrame != 3 && timeFrame != 4 && timeFrame != 5)
        return res.status(400).json({
          success: false,
          message: "Invalid bet timeframe",
        });

      const strikeMultiplier = new Decimal(2);
      const maxPayout = new Decimal(
        maxPayouts[tokenMint as GameTokens].options,
      );

      const isSuperToken = tokenMint === "SUPER";
      if (!isSuperToken && amount > maxPayout.toNumber())
        return res.status(400).json({
          success: false,
          message: "Bet amount exceeds max payout!",
        });

      await connectDatabase();

      const betTime = new Date();
      const betEndTime = new Date(betTime.getTime() + timeFrame * 60 * 1000);
      const betTimeInSec = Math.floor(betTime.getTime() / 1000);

      await new Promise((r) => setTimeout(r, 2000));

      const strikePrice = await getSolPrice(betTimeInSec);

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
          .json({ success: false, message: "User does not exist !" });

      if (!user.isWeb2User && isSuperToken)
        return res
          .status(400)
          .json({ success: false, message: "You cannot bet with this token!" });

      const account = user._id;

      let bet = await Option.findOne({
        account,
        result: "Pending",
      });

      if (bet)
        return res.status(400).json({
          success: false,
          message: "Another bet is active on this account",
        });

      if (
        user.deposit.find((d: any) => d.tokenMint === tokenMint)?.amount <
        amount
      )
        return res
          .status(400)
          .json({ success: false, message: "Insufficient balance for bet!" });

      const addGame = !user.gamesPlayed.includes(GameType.options);

      const result = await User.findOneAndUpdate(
        {
          _id: account,
          deposit: {
            $elemMatch: {
              tokenMint: tokenMint,
              amount: { $gte: amount },
            },
          },
          isOptionOngoing: false,
        },
        {
          $inc: {
            "deposit.$.amount": -amount,
            numOfGamesPlayed: 1,
          },
          isOptionOngoing: true,
          ...(addGame ? { $addToSet: { gamesPlayed: GameType.options } } : {}),
          $set: {
            isWeb2User: tokenMint === "SUPER",
          },
        },
        {
          new: true,
        },
      );

      if (!result) {
        throw new Error("Insufficient balance for bet!");
      }

      const record = new Option({
        account,
        betTime,
        betEndTime,
        amount,
        betType,
        strikeMultiplier,
        strikePrice,
        timeFrame: 60 * timeFrame,
        result: "Pending",
        tokenMint,
        amountWon: 0,
        amountLost: 0,
      });
      await record.save();

      await updateGameStats(
        account,
        GameType.options,
        tokenMint,
        amount,
        addGame,
        0,
      );

      const rest = record.toObject();
      rest.game = GameType.options;
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

      return res.json({
        success: true,
        data: { betTime, strikePrice },
        message: `${amount} ${splToken.tokenName} successfully deposited!`,
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

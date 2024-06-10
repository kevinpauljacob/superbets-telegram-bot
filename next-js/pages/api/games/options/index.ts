import connectDatabase from "../../../../utils/database";
import { User, Option } from "../../../../models/games";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { minGameAmount, wsEndpoint } from "@/context/gameTransactions";
import { Decimal } from "decimal.js";
import { maintainance, maxPayouts } from "@/context/transactions";
import StakingUser from "@/models/staking/user";
import { GameTokens, GameType } from "@/utils/provably-fair";
import { SPL_TOKENS } from "@/context/config";
import updateGameStats from "../global/updateGameStats";
Decimal.set({ precision: 9 });

const secret = process.env.NEXTAUTH_SECRET;

export const config = {
  maxDuration: 60,
};

type InputType = {
  wallet: string;
  amount: number;
  tokenMint: string;
  betType: "betUp" | "betDown";
  timeFrame: number;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, amount, tokenMint, betType, timeFrame }: InputType =
        req.body;

      if (maintainance)
        return res.status(400).json({
          success: false,
          message: "Under maintenance",
        });

      const token = await getToken({ req, secret });

      if (!token || !token.sub || token.sub != wallet)
        return res.status(400).json({
          success: false,
          message: "User wallet not authenticated",
        });

      if (!wallet || !amount || !tokenMint || !betType)
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
      const maxPayout = Decimal.mul(amount, strikeMultiplier);

      if (
        !(maxPayout.toNumber() <= maxPayouts[tokenMint as GameTokens].options)
      )
        return res
          .status(400)
          .json({ success: false, message: "Max payout exceeded" });

      await connectDatabase();

      let betTime = new Date();
      let betEndTime = new Date(betTime.getTime() + timeFrame * 60 * 1000);

      await new Promise((r) => setTimeout(r, 2000));

      let strikePrice = await fetch(
        `https://hermes.pyth.network/api/get_price_feed?id=0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d&publish_time=${Math.floor(
          betTime.getTime() / 1000,
        )}`,
      )
        .then((res) => res.json())
        .then((data) => data.price.price * Math.pow(10, data.price.expo));

      let user = await User.findOne({ wallet });
      let bet = await Option.findOne({ wallet, result: "Pending" });

      if (!user)
        return res
          .status(400)
          .json({ success: false, message: "User does not exist !" });

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
          .json({ success: false, message: "Insufficient balance !" });

      const addGame = !user.gamesPlayed.includes(GameType.options);

      const result = await User.findOneAndUpdate(
        {
          wallet,
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
        },
        {
          new: true,
        },
      );

      if (!result) {
        throw new Error("Insufficient balance for bet!");
      }

      const record = new Option({
        wallet,
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

      await updateGameStats(GameType.options, tokenMint, amount, addGame, 0);

      const userData = await StakingUser.findOneAndUpdate(
        { wallet },
        {},
        { upsert: true, new: true },
      );
      const userTier = userData?.tier ?? 0;

      const rest = record.toObject();
      rest.game = GameType.options;
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

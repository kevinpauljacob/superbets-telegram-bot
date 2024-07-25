import connectDatabase from "../../../../utils/database";
import { User, Option } from "../../../../models/games";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { wsEndpoint } from "@/context/config";
import { Decimal } from "decimal.js";
import { maxPayouts, minAmtFactor, maintainance } from "@/context/config";
import StakingUser from "@/models/staking/user";
import { GameTokens, GameType } from "@/utils/provably-fair";
import { SPL_TOKENS } from "@/context/config";
import updateGameStats from "../../../../utils/updateGameStats";
import { getSolPrice } from "@/context/transactions";
Decimal.set({ precision: 9 });

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

      const token = await getToken({ req, secret });

      if (
        !token ||
        !token.sub ||
        (wallet && token.sub != wallet) ||
        (email && token.email !== email)
      )
        return res.status(400).json({
          success: false,
          message: "User not authenticated",
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
      const maxPayout = Decimal.mul(amount, strikeMultiplier);

      if (
        !(maxPayout.toNumber() <= maxPayouts[tokenMint as GameTokens].options)
      )
        return res
          .status(400)
          .json({ success: false, message: "Max payout exceeded" });

      await connectDatabase();

      const betTime = new Date();
      const betEndTime = new Date(betTime.getTime() + timeFrame * 60 * 1000);
      const betTimeInSec = Math.floor(betTime.getTime() / 1000);

      await new Promise((r) => setTimeout(r, 2000));

      const strikePrice = await getSolPrice(betTimeInSec);

      let user = await User.findOne({
        $or: [{ wallet: wallet }, { email: email }],
      });

      let bet = await Option.findOne({
        $or: [{ wallet: wallet }, { email: email }],
        result: "Pending",
      });

      if (!user)
        return res
          .status(400)
          .json({ success: false, message: "User does not exist !" });

      if (!user.isWeb2User && tokenMint === "WEB2")
        return res
          .status(400)
          .json({ success: false, message: "You cannot bet with this token!" });

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
          .json({ success: false, message: "Insufficient balance " });

      const addGame = !user.gamesPlayed.includes(GameType.options);

      const account = user._id;

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
            isWeb2User: tokenMint === "WEB2",
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
        wallet,
        GameType.options,
        tokenMint,
        amount,
        addGame,
        0,
      );

      let userData;
      if (wallet)
        userData = await StakingUser.findOneAndUpdate(
          { wallet },
          {},
          { upsert: true, new: true },
        );

      const userTier = userData?.tier ?? 0;

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

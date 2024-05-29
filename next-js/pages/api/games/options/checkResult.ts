import connectDatabase from "../../../../utils/database";
import { Option, User } from "../../../../models/games";
import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import StakingUser from "@/models/staking/user";
import {
  houseEdgeTiers,
  launchPromoEdge,
  pointTiers,
} from "@/context/transactions";
import { GameType } from "@/utils/provably-fair";
import { optionsEdge, wsEndpoint } from "@/context/gameTransactions";
import { Decimal } from "decimal.js";
Decimal.set({ precision: 9 });

const secret = process.env.NEXTAUTH_SECRET;

export const config = {
  maxDuration: 60,
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet } = req.body;

      const token = await getToken({ req, secret });

      if (!token || !token.sub || token.sub != wallet)
        return res.send({
          error: "User wallet not authenticated",
        });

      if (!wallet)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      await connectDatabase();

      let user = await User.findOne({ wallet });
      if (!user)
        return res
          .status(400)
          .json({ success: false, message: "User does not exist !" });

      let bet = await Option.findOne({ wallet, result: "Pending" });
      if (!bet)
        return res.status(400).json({
          success: false,
          message: "No active bets on this account",
        });

      const userData = await StakingUser.findOneAndUpdate(
        { wallet },
        {},
        { upsert: true, new: true },
      );
      const userTier = userData?.tier ?? 0;
      const houseEdge =
        optionsEdge + (launchPromoEdge ? 0 : houseEdgeTiers[userTier]);
      // const houseEdge = launchPromoEdge ? 0 : houseEdgeTiers[userTier];

      await new Promise((r) => setTimeout(r, 2000));

      let betEndPrice = await fetch(
        `https://hermes.pyth.network/api/get_price_feed?id=0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d&publish_time=${Math.floor(
          new Date(bet.betEndTime).getTime() / 1000,
        )}`,
      )
        .then((res) => res.json())
        .then((data) => data.price.price * Math.pow(10, data.price.expo));

      let result = "Lost";
      let amountWon = new Decimal(0);
      let amountLost = bet.amount;

      if (
        (bet.betType === "betUp" && betEndPrice > bet.strikePrice) ||
        (bet.betType === "betDown" && betEndPrice < bet.strikePrice)
      ) {
        result = "Won";
        amountWon = Decimal.mul(bet.amount, 2).mul(Decimal.sub(1, houseEdge));
        amountLost = 0;
      }

      const status = await User.findOneAndUpdate(
        {
          wallet,
          deposit: {
            $elemMatch: {
              tokenMint: "SOL",
            },
          },
          isOptionOngoing: true,
        },
        {
          $inc: {
            "deposit.$.amount": amountWon,
            numOfGamesPlayed: 1,
          },
          isOptionOngoing: false,
        },
        {
          new: true,
        },
      );

      if (!status) {
        throw new Error("User could not be updated !");
      }

      const record = await Option.findOneAndUpdate(
        { wallet, result: "Pending" },
        {
          result,
          betEndPrice,
          houseEdge,
          amountWon,
          amountLost,
        },
        { new: true },
      );

      const pointsGained =
        0 * user.numOfGamesPlayed + 1.4 * bet.amount * userData.multiplier;

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

      const rest = record.toObject();
      rest.game = GameType.options;
      rest.userTier = parseInt(newTier);

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
        data: { amountWon, amountLost, result },
        message: `${result} ${
          result == "Won" ? amountWon.toFixed(4) : amountLost.toFixed(4)
        } SOL!`,
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

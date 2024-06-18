import connectDatabase from "../../../../utils/database";
import { Option, User } from "../../../../models/games";
import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import StakingUser from "@/models/staking/user";
import { houseEdgeTiers, pointTiers, stakingTiers } from "@/context/config";
import { launchPromoEdge } from "@/context/config";
import { GameType } from "@/utils/provably-fair";
import { optionsEdge, wsEndpoint } from "@/context/config";
import { Decimal } from "decimal.js";
import { SPL_TOKENS, maintainance } from "@/context/config";
import updateGameStats from "../../../../utils/updateGameStats";
import { getSolPrice } from "@/context/transactions";
Decimal.set({ precision: 9 });

const secret = process.env.NEXTAUTH_SECRET;

export const config = {
  maxDuration: 60,
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet } = req.body;

      if (maintainance)
        return res.status(400).json({
          success: false,
          message: "Under maintenance",
        });

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

      const bet = await Option.findOne({ wallet, result: "Pending" });
      if (!bet)
        return res.status(400).json({
          success: false,
          message: "No active bets on this account",
        });

      const { tokenMint, betEndTime, amount, betType, strikePrice } = bet;

      const userData = await StakingUser.findOneAndUpdate(
        { wallet },
        {},
        { upsert: true, new: true },
      );

      const stakeAmount = userData?.stakedAmount ?? 0;
      const stakingTier = Object.entries(stakingTiers).reduce((prev, next) => {
        return stakeAmount >= next[1]?.limit ? next : prev;
      })[0];
      const isFomoToken =
        tokenMint === SPL_TOKENS.find((t) => t.tokenName === "FOMO")?.tokenMint
          ? true
          : false;
      const houseEdge =
        optionsEdge +
        (launchPromoEdge || isFomoToken
          ? 0
          : houseEdgeTiers[parseInt(stakingTier)]);

      await new Promise((r) => setTimeout(r, 2000));

      const betEndTimeInSec = Math.floor(new Date(betEndTime).getTime() / 1000);

      const betEndPrice = await getSolPrice(betEndTimeInSec);

      let result = "Lost";
      let amountWon = new Decimal(0);
      let amountLost = amount;
      let feeGenerated = 0;

      if (
        (betType === "betUp" && betEndPrice > strikePrice) ||
        (betType === "betDown" && betEndPrice < strikePrice)
      ) {
        result = "Won";
        amountWon = Decimal.mul(amount, 2).mul(Decimal.sub(1, houseEdge));
        amountLost = 0;

        feeGenerated = Decimal.mul(amount, 2).mul(houseEdge).toNumber();
      }

      const status = await User.findOneAndUpdate(
        {
          wallet,
          deposit: {
            $elemMatch: {
              tokenMint,
            },
          },
          isOptionOngoing: true,
        },
        {
          $inc: {
            "deposit.$.amount": amountWon,
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

      if (!record)
        return res
          .status(400)
          .json({ success: false, message: "Game already concluded!" });

      await updateGameStats(
        wallet,
        GameType.options,
        tokenMint,
        0,
        false,
        feeGenerated,
      );

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
        } ${SPL_TOKENS.find((token) => token.tokenMint === tokenMint)?.tokenName ?? ""}!`,
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

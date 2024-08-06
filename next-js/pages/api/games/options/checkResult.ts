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

/**
 * @swagger
 * /api/games/options/checkResult:
 *   post:
 *     summary: Check the result of an active bet
 *     description: Checks the result of an active (pending) bet for a user based on their wallet or email and updates the result accordingly.
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
 *             required:
 *               - wallet
 *               - email
 *     responses:
 *       200:
 *         description: Bet result checked and updated successfully.
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
 *                     amountWon:
 *                       type: number
 *                     amountLost:
 *                       type: number
 *                     result:
 *                       type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: User does not exist or no active bets found.
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

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, email } = req.body;

      if (maintainance)
        return res.status(400).json({
          success: false,
          message: "Under maintenance",
        });

      if (!wallet && !email)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

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

      const account = user._id;

      const bet = await Option.findOne({ account, result: "Pending" });
      if (!bet)
        return res.status(400).json({
          success: false,
          message: "No active bets on this account",
        });

      const { tokenMint, betEndTime, amount, betType, strikePrice } = bet;

      const stakeAmount = 0;
      const stakingTier = Object.entries(stakingTiers).reduce((prev, next) => {
        return stakeAmount >= next[1]?.limit ? next : prev;
      })[0];
      const houseEdge = launchPromoEdge
        ? 0
        : houseEdgeTiers[parseInt(stakingTier)];

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
          account,
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
        throw new Error("User could not be updated!");
      }

      const record = await Option.findOneAndUpdate(
        { account, result: "Pending" },
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
        email,
        GameType.options,
        tokenMint,
        0,
        false,
        feeGenerated,
      );

      // const pointsGained =
      //   0 * user.numOfGamesPlayed + 1.4 * amount * userData.multiplier;

      // const points = userData.points + pointsGained;
      // const newTier = Object.entries(pointTiers).reduce((prev, next) => {
      //   return points >= next[1]?.limit ? next : prev;
      // })[0];

      // if (wallet) {
      //   await StakingUser.findOneAndUpdate(
      //     {
      //       wallet,
      //     },
      //     {
      //       $inc: {
      //         points: pointsGained,
      //       },
      //     },
      //   );
      // }

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
        data: { amountWon, amountLost, result },
        message: `${result} ${
          result == "Won" ? amountWon.toFixed(4) : amountLost.toFixed(4)
        } ${
          SPL_TOKENS.find((token) => token.tokenMint === tokenMint)
            ?.tokenName ?? ""
        }!`,
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

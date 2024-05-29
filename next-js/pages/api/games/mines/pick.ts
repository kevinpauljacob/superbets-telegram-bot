import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { Mines, User } from "@/models/games";
import { generateGameResult, GameType } from "@/utils/provably-fair";
import StakingUser from "@/models/staking/user";
import {
  houseEdgeTiers,
  launchPromoEdge,
  pointTiers,
} from "@/context/transactions";
import { wsEndpoint } from "@/context/gameTransactions";
import Decimal from "decimal.js";
Decimal.set({ precision: 9 });

const secret = process.env.NEXTAUTH_SECRET;

export const config = {
  maxDuration: 60,
};

type InputType = {
  wallet: string;
  gameId: string;
  userBet: number;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, gameId, userBet }: InputType = req.body;

      const token = await getToken({ req, secret });

      if (!token || !token.sub || token.sub != wallet)
        return res.status(400).json({
          success: false,
          message: "User wallet not authenticated",
        });

      await connectDatabase();

      if (!wallet || !gameId || userBet == null)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      if (!(Number.isInteger(userBet) && 0 <= userBet && userBet <= 24))
        return res
          .status(400)
          .json({ success: false, message: "Invalid parameters" });

      let user = await User.findOne({ wallet });

      if (!user)
        return res
          .status(400)
          .json({ success: false, message: "User does not exist !" });

      let gameInfo = await Mines.findOne({
        _id: gameId,
        result: "Pending",
      }).populate("gameSeed");

      if (!gameInfo)
        return res
          .status(400)
          .json({ success: false, message: "Game does not exist !" });

      if (gameInfo.wallet !== wallet)
        return res.status(400).json({
          success: false,
          message: "User not authorized to play this game!",
        });

      let {
        nonce,
        gameSeed,
        minesCount,
        userBets,
        amountWon,
        amount,
        strikeMultiplier,
      } = gameInfo;

      if (userBets.includes(userBet))
        return res.status(400).json({
          success: false,
          message: "You have already picked this number!",
        });

      const strikeNumbers = generateGameResult(
        gameSeed.serverSeed,
        gameSeed.clientSeed,
        nonce,
        GameType.mines,
        minesCount,
      );

      let result = "Pending";
      const numBets = userBets.length;
      strikeMultiplier = Decimal.div(25 - numBets, 25 - numBets - minesCount)
        .mul(strikeMultiplier)
        .toNumber();

      const userData = await StakingUser.findOneAndUpdate(
        { wallet },
        {},
        { upsert: true, new: true },
      );
      const userTier = userData?.tier ?? 0;
      const houseEdge = launchPromoEdge ? 0 : houseEdgeTiers[userTier];

      let record;
      if (strikeNumbers[userBet] === 1) {
        result = "Lost";

        record = await Mines.findOneAndUpdate(
          {
            _id: gameId,
            result: "Pending",
          },
          {
            result,
            strikeMultiplier: 0,
            amountWon: 0,
            amountLost: gameInfo.amount,
            $push: { userBets: userBet },
            $set: { strikeNumbers },
          },
          {
            new: true,
          },
        ).populate("gameSeed");
      } else {
        amountWon = Decimal.mul(Math.max(amount, amountWon), strikeMultiplier)
          .mul(Decimal.sub(1, houseEdge))
          .toNumber();

        if (numBets === 25 - minesCount + 1) {
          result = "Won";

          const userUpdate = await User.findOneAndUpdate(
            {
              wallet,
              deposit: {
                $elemMatch: {
                  tokenMint: "SOL",
                },
              },
            },
            {
              $inc: {
                "deposit.$.amount": amountWon,
              },
            },
            {
              new: true,
            },
          );

          if (!userUpdate) {
            throw new Error("Insufficient balance for action!!");
          }

          record = await Mines.findOneAndUpdate(
            {
              _id: gameId,
              result: "Pending",
            },
            {
              result,
              houseEdge,
              strikeMultiplier,
              amountWon,
              $push: { userBets: userBet },
              $set: { strikeNumbers },
            },
            {
              new: true,
            },
          ).populate("gameSeed");
        } else {
          await Mines.findOneAndUpdate(
            {
              _id: gameId,
              result: "Pending",
            },
            {
              $push: { userBets: userBet },
              amountWon,
              strikeMultiplier,
            },
          );
        }
      }

      if (result !== "Pending") {
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

        const { gameSeed, ...rest } = record.toObject();
        rest.game = GameType.mines;
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
      }

      return res.status(201).json({
        success: true,
        message:
          result === "Won"
            ? "Congratulations! You won!"
            : result === "Lost"
            ? "Better luck next time!"
            : "Game in progress",
        result,
        ...(result === "Pending" ? {} : { strikeNumbers }),
        strikeMultiplier,
        amountWon,
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

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

      if (!(0 <= userBet && userBet <= 24))
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

      let {
        nonce,
        gameSeed,
        minesCount,
        userBets,
        amountWon,
        amount,
        strikeMultiplier,
      } = gameInfo;

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

      const userData = await StakingUser.findOne({ wallet });
      let points = userData?.points ?? 0;
      const userTier = Object.entries(pointTiers).reduce((prev, next) => {
        return points >= next[1]?.limit ? next : prev;
      })[0];
      const houseEdge = launchPromoEdge
        ? 0
        : houseEdgeTiers[parseInt(userTier)];
      if (strikeNumbers[userBet] === 1) {
        result = "Lost";

        await Mines.findOneAndUpdate(
          {
            _id: gameId,
            result: "Pending",
          },
          {
            result,
            userBets,
            strikeNumbers,
            strikeMultiplier,
            amountWon: 0,
            amountLost: gameInfo.amount,
          },
        );
      } else {
        amountWon = Decimal.mul(Math.max(amount, amountWon), strikeMultiplier)
          .mul(Decimal.sub(1, houseEdge))
          .toNumber();

        if (numBets === 25 - minesCount) {
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

          await Mines.findOneAndUpdate(
            {
              _id: gameId,
              result: "Pending",
            },
            {
              result,
              houseEdge,
              strikeNumbers,
              strikeMultiplier,
              amountWon,
              $push: { userBets: userBet },
            },
          );
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
        const socket = new WebSocket(wsEndpoint);

        socket.onopen = () => {
          socket.send(
            JSON.stringify({
              clientType: "api-client",
              channel: "fomo-casino_games-channel",
              authKey: process.env.FOMO_CHANNEL_AUTH_KEY!,
              payload: {
                game: GameType.mines,
                wallet,
                result,
                userTier,
                time: new Date(),
                strikeMultiplier,
                amount,
                amountWon,
              },
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

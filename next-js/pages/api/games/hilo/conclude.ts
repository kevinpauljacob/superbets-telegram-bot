import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { Hilo, User } from "@/models/games";
import { generateGameResult, GameType } from "@/utils/provably-fair";
import StakingUser from "@/models/staking/user";
import { houseEdgeTiers, pointTiers } from "@/context/transactions";
import { wsEndpoint } from "@/context/gameTransactions";
import { Decimal } from "decimal.js";
Decimal.set({ precision: 9 });

const secret = process.env.NEXTAUTH_SECRET;

export const config = {
  maxDuration: 60,
};

type InputType = {
  wallet: string;
  gameId: string;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, gameId }: InputType = req.body;

      const token = await getToken({ req, secret });

      if (!token || !token.sub || token.sub != wallet)
        return res.status(400).json({
          success: false,
          message: "User wallet not authenticated",
        });

      await connectDatabase();

      if (!wallet || !gameId)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      let user = await User.findOne({ wallet });

      if (!user)
        return res
          .status(400)
          .json({ success: false, message: "User does not exist !" });

      let gameInfo = await Hilo.findOne({
        _id: gameId,
        result: "Pending",
      }).populate("gameSeed");

      if (!gameInfo)
        return res
          .status(400)
          .json({ success: false, message: "Game does not exist !" });

      let { nonce, gameSeed, startNumber, amountWon, amount } = gameInfo;

      const strikeNumbers = generateGameResult(
        gameSeed.serverSeed,
        gameSeed.clientSeed,
        nonce,
        GameType.mines,
        startNumber,
      );

      const userData = await StakingUser.findOne({ wallet });
      let points = userData?.points ?? 0;
      const userTier = Object.entries(pointTiers).reduce((prev, next) => {
        return points >= next[1]?.limit ? next : prev;
      })[0];
      const houseEdge = houseEdgeTiers[parseInt(userTier)];

      amountWon = Decimal.mul(amountWon, Decimal.sub(1, houseEdge)).toNumber();
      const result = "Won";

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

      await Hilo.findOneAndUpdate(
        {
          _id: gameId,
          result: "Pending",
        },
        {
          result,
          strikeNumbers,
          houseEdge,
          amountWon,
        },
      );

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
              absAmount: Decimal.sub(amountWon, amount).toNumber(),
              result,
              userTier,
            },
          }),
        );

        socket.close();
      };

      return res.status(201).json({
        success: true,
        message: "Congratulations! You won!",
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

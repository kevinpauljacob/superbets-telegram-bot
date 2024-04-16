import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { Mines, User } from "@/models/games";
import { generateGameResult, GameType } from "@/utils/vrf";
import StakingUser from "@/models/staking/user";
import { pointTiers } from "@/context/transactions";
import { wsEndpoint } from "@/context/gameTransactions";

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

      let gameInfo = await Mines.findOne({
        _id: gameId,
        result: "Pending",
      }).populate("gameSeed");

      if (!gameInfo)
        return res
          .status(400)
          .json({ success: false, message: "Game does not exist !" });

      let { nonce, gameSeed, minesCount, inputMines } = gameInfo;

      const resultMines = generateGameResult(
        gameSeed.serverSeed,
        gameSeed.clientSeed,
        nonce,
        GameType.mines,
        minesCount,
      );

      const result = "Won";
      let amountWon = 0;
      for (let i = 0; i < 25 - minesCount; i++) {
        amountWon += (gameInfo.amount * (25 - i)) / minesCount;
      }

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
          resultMines,
          amountWon,
        },
      );

      const userData = await StakingUser.findOne({ wallet });
      let points = userData?.points ?? 0;
      const userTier = Object.entries(pointTiers).reduce((prev, next) => {
        return points >= next[1]?.limit ? next : prev;
      })[0];

      const socket = new WebSocket(wsEndpoint);

      socket.onopen = () => {
        console.log("WebSocket connection opened");
        socket.send(
          JSON.stringify({
            clientType: "api-client",
            channel: "fomo-casino_games-channel",
            authKey: process.env.FOMO_CHANNEL_AUTH_KEY!,
            payload: {
              game: GameType.mines,
              wallet,
              absAmount: amountWon,
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

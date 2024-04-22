import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { Hilo, User } from "@/models/games";
import { generateGameResult, GameType } from "@/utils/provably-fair";
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
  userBet: "Higher" | "Lower";
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

      if (!wallet || !gameId || !userBet)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      if (!["Higher", "Lower"].includes(userBet))
        return res
          .status(400)
          .json({ success: false, message: "Invalid parameters" });

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

      let { nonce, gameSeed, userBets, startNumber, amount, amountWon } =
        gameInfo;

      const strikeNumbers = generateGameResult(
        gameSeed.serverSeed,
        gameSeed.clientSeed,
        nonce,
        GameType.hilo,
        startNumber,
      );

      let result = "Pending";
      const currentIndex = userBets.length;

      if (
        !(
          (userBet === "Higher" &&
            strikeNumbers[currentIndex] % 13 >=
              strikeNumbers[currentIndex - 1] % 13) ||
          (userBet === "Lower" &&
            strikeNumbers[currentIndex] % 13 <=
              strikeNumbers[currentIndex - 1] % 13)
        )
      ) {
        result = "Lost";

        await Hilo.findOneAndUpdate(
          {
            _id: gameId,
            result: "Pending",
          },
          {
            result,
            user,
            userBets: { $addToSet: userBet },
            strikeNumbers,
            amountWon: 0,
            amountLost: gameInfo.amount,
          },
        );
      } else {
        amountWon = Math.max(amount, amountWon);

        let winChance = 0;
        for (let i = 1; i <= 52; ++i) {
          if (userBets.includes(i)) continue;

          if (
            (userBet === "Higher" &&
              i % 13 >= strikeNumbers[currentIndex - 1] % 13) ||
            (userBet === "Lower" &&
              i % 13 <= strikeNumbers[currentIndex - 1] % 13)
          )
            winChance++;
        }

        amountWon *= winChance / 52;

        if (currentIndex + 1 === 52) {
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

          await Hilo.findOneAndUpdate(
            {
              _id: gameId,
              result: "Pending",
            },
            {
              result,
              userBets: { $addToSet: userBet },
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
            socket.send(
              JSON.stringify({
                clientType: "api-client",
                channel: "fomo-casino_games-channel",
                authKey: process.env.FOMO_CHANNEL_AUTH_KEY!,
                payload: {
                  game: GameType.hilo,
                  wallet,
                  absAmount: amountWon,
                  result,
                  userTier,
                },
              }),
            );

            socket.close();
          };
        } else {
          await Hilo.findOneAndUpdate(
            {
              _id: gameId,
              result: "Pending",
            },
            {
              userBets: { $addToSet: userBet },
              amountWon,
            },
          );
        }
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

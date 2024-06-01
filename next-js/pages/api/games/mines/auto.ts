import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { GameSeed, Mines, User } from "@/models/games";
import {
  GameType,
  decryptServerSeed,
  generateGameResult,
  seedStatus,
} from "@/utils/provably-fair";
import StakingUser from "@/models/staking/user";
import { minGameAmount, wsEndpoint } from "@/context/gameTransactions";
import Decimal from "decimal.js";
import {
  houseEdgeTiers,
  launchPromoEdge,
  pointTiers,
} from "@/context/transactions";

const secret = process.env.NEXTAUTH_SECRET;
const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");

export const config = {
  maxDuration: 60,
};

type InputType = {
  wallet: string;
  amount: number;
  tokenMint: string;
  minesCount: number;
  userBets: Array<number>;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, amount, tokenMint, minesCount, userBets }: InputType =
        req.body;

      const token = await getToken({ req, secret });

      if (!token || !token.sub || token.sub != wallet)
        return res.status(400).json({
          success: false,
          message: "User wallet not authenticated",
        });

      if (!wallet || !amount || !tokenMint || !minesCount || !userBets)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      if (
        typeof amount !== "number" ||
        !isFinite(amount) ||
        tokenMint !== "SOL" ||
        !(
          Number.isInteger(minesCount) &&
          1 <= minesCount &&
          minesCount <= 24
        ) ||
        !(userBets.length > 0 && userBets.length <= 25 - minesCount) ||
        !userBets.every(
          (bet: number) => Number.isInteger(bet) && 0 <= bet && bet <= 24,
        )
      )
        return res
          .status(400)
          .json({ success: false, message: "Invalid parameters" });

      if (amount < minGameAmount)
        return res.status(400).json({
          success: false,
          message: "Invalid bet amount",
        });

      await connectDatabase();

      const pendingGame = await Mines.findOne({ wallet, result: "Pending" });
      if (pendingGame)
        return res.status(400).json({
          success: false,
          message: `Previous game is still pending, gameId:${pendingGame._id}`,
        });

      let user = await User.findOne({ wallet });

      if (!user)
        return res
          .status(400)
          .json({ success: false, message: "User does not exist !" });

      if (
        user.deposit.find((d: any) => d.tokenMint === tokenMint)?.amount <
        amount
      )
        return res
          .status(400)
          .json({ success: false, message: "Insufficient balance !" });

      const activeGameSeed = await GameSeed.findOneAndUpdate(
        {
          wallet,
          status: seedStatus.ACTIVE,
        },
        {
          $inc: {
            nonce: 1,
          },
        },
        { new: true },
      );

      if (!activeGameSeed) {
        throw new Error("Server hash not found!");
      }

      const {
        serverSeed: encryptedServerSeed,
        clientSeed,
        nonce,
        iv,
      } = activeGameSeed;
      const serverSeed = decryptServerSeed(
        encryptedServerSeed,
        encryptionKey,
        Buffer.from(iv, "hex"),
      );

      const strikeNumbers = generateGameResult(
        serverSeed,
        clientSeed,
        nonce,
        GameType.mines,
        minesCount,
      );

      const result = userBets.some((bet) => strikeNumbers.at(bet) === 1)
        ? "Lost"
        : "Won";

      const numBets = userBets.length;

      const userData = await StakingUser.findOneAndUpdate(
        { wallet },
        {},
        { upsert: true, new: true },
      );
      const userTier = userData?.tier ?? 0;
      const houseEdge = launchPromoEdge ? 0 : houseEdgeTiers[userTier];

      let strikeMultiplier = 0,
        amountWon = 0,
        amountLost = amount;

      if (result === "Lost") {
        const userUpdate = await User.findOneAndUpdate(
          {
            wallet,
            deposit: {
              $elemMatch: {
                tokenMint,
                amount: { $gte: amount },
              },
            },
          },
          {
            $inc: {
              "deposit.$.amount": -amount,
              numOfGamesPlayed: 1,
            },
          },
          {
            new: true,
          },
        );

        if (!userUpdate) {
          throw new Error("Insufficient balance for action!!");
        }
      } else {
        strikeMultiplier = 1;

        for (let i = 0; i < numBets; i++)
          strikeMultiplier = Decimal.div(25 - i, 25 - i - minesCount)
            .mul(strikeMultiplier)
            .toNumber();
        strikeMultiplier = Math.min(strikeMultiplier, 25);

        amountWon = Decimal.mul(amount, strikeMultiplier)
          .mul(Decimal.sub(1, houseEdge))
          .toNumber();
        amountLost = 0;

        const userUpdate = await User.findOneAndUpdate(
          {
            wallet,
            deposit: {
              $elemMatch: {
                tokenMint,
                amount: { $gte: amount },
              },
            },
          },
          {
            $inc: {
              "deposit.$.amount": Decimal.sub(amountWon, amount),
              numOfGamesPlayed: 1,
            },
          },
          {
            new: true,
          },
        );

        if (!userUpdate) {
          throw new Error("Insufficient balance for action!!");
        }
      }

      const mines = new Mines({
        wallet,
        amount,
        minesCount,
        strikeMultiplier,
        strikeNumbers,
        userBets,
        result,
        tokenMint,
        amountWon,
        amountLost,
        nonce,
        gameSeed: activeGameSeed._id,
      });
      await mines.save();

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

      const { gameSeed, ...rest } = mines.toObject();
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

      const message =
        result === "Won"
          ? "Congratulations! You won!"
          : "Better luck next time!";

      return res.status(201).json({
        success: true,
        result,
        amountWon,
        strikeNumbers,
        strikeMultiplier,
        pointsGained: userBets.length,
        message,
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

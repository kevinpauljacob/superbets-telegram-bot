import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { Mines, User } from "@/models/games";
import {
  generateGameResult,
  GameType,
  decryptServerSeed,
} from "@/utils/provably-fair";
import StakingUser from "@/models/staking/user";
import {
  houseEdgeTiers,
  launchPromoEdge,
  pointTiers,
  stakingTiers,
} from "@/context/transactions";
import { wsEndpoint } from "@/context/gameTransactions";
import Decimal from "decimal.js";
import { SPL_TOKENS } from "@/context/config";
import updateGameStats from "../../../../utils/updateGameStats";
Decimal.set({ precision: 9 });

const secret = process.env.NEXTAUTH_SECRET;
const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");

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

      let gameInfo = await Mines.findOne({
        _id: gameId,
        result: "Pending",
        wallet,
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
        tokenMint,
      } = gameInfo;

      if (userBets.includes(userBet))
        return res.status(400).json({
          success: false,
          message: "You have already picked this number!",
        });

      const { serverSeed: encryptedServerSeed, clientSeed, iv } = gameSeed;
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

      let result = "Pending";
      const numBets = userBets.length;
      strikeMultiplier = Decimal.div(25 - numBets, 25 - numBets - minesCount)
        .mul(strikeMultiplier)
        .toNumber();

      if (strikeMultiplier > 25)
        return res.status(400).json({
          success: false,
          message: "Max payout of 25 exceeded! Cashout to continue...",
        });

      const userData = await StakingUser.findOneAndUpdate(
        { wallet },
        {},
        { upsert: true, new: true },
      );

      let user = await User.findOne({ wallet });

      const stakeAmount = userData?.stakedAmount ?? 0;
      const stakingTier = Object.entries(stakingTiers).reduce((prev, next) => {
        return stakeAmount >= next[1]?.limit ? next : prev;
      })[0];
      const isFomoToken =
        tokenMint === SPL_TOKENS.find((t) => t.tokenName === "FOMO")?.tokenMint
          ? true
          : false;
      const houseEdge =
        launchPromoEdge || isFomoToken
          ? 0
          : houseEdgeTiers[parseInt(stakingTier)];

      let record;
      if (strikeNumbers[userBet] === 1) {
        result = "Lost";

        record = await Mines.findOneAndUpdate(
          {
            _id: gameId,
            result: "Pending",
            wallet,
            userBets: { $ne: userBet },
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
        amountWon = Decimal.mul(amount, strikeMultiplier)
          .mul(Decimal.sub(1, houseEdge))
          .toNumber();

        if (numBets + 1 === 25 - minesCount) {
          result = "Won";
          const feeGenerated = Decimal.mul(amount, strikeMultiplier)
            .mul(houseEdge)
            .toNumber();

          await User.findOneAndUpdate(
            {
              wallet,
              deposit: {
                $elemMatch: {
                  tokenMint,
                },
              },
            },
            {
              $inc: {
                "deposit.$.amount": amountWon,
              },
            },
          );

          record = await Mines.findOneAndUpdate(
            {
              _id: gameId,
              wallet,
              result: "Pending",
              userBets: { $ne: userBet },
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

          await updateGameStats(
            GameType.mines,
            tokenMint,
            0,
            false,
            feeGenerated,
          );
        } else {
          await Mines.findOneAndUpdate(
            {
              _id: gameId,
              wallet,
              result: "Pending",
            },
            {
              $push: { userBets: userBet },
              houseEdge,
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

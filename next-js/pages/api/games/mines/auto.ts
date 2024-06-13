import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { GameSeed, Mines, User } from "@/models/games";
import {
  GameTokens,
  GameType,
  decryptServerSeed,
  generateGameResult,
  seedStatus,
} from "@/utils/provably-fair";
import StakingUser from "@/models/staking/user";
import { wsEndpoint, maintainance } from "@/context/config";
import Decimal from "decimal.js";
import { isArrayUnique } from "@/context/transactions";
import {
  houseEdgeTiers,
  maxPayouts,
  minAmtFactor,
  pointTiers,
  stakingTiers,
} from "@/context/config";
import { launchPromoEdge } from "@/context/config";
import { SPL_TOKENS } from "@/context/config";
import updateGameStats from "../../../../utils/updateGameStats";

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

      if (maintainance)
        return res.status(400).json({
          success: false,
          message: "Under maintenance",
        });

      const minGameAmount =
        maxPayouts[tokenMint as GameTokens]["mines" as GameType] * minAmtFactor;

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

      const splToken = SPL_TOKENS.find((t) => t.tokenMint === tokenMint);
      if (
        typeof amount !== "number" ||
        !isFinite(amount) ||
        !splToken ||
        !(
          Number.isInteger(minesCount) &&
          1 <= minesCount &&
          minesCount <= 24
        ) ||
        !(userBets.length > 0 && userBets.length <= 25 - minesCount) ||
        !userBets.every(
          (bet: number) => Number.isInteger(bet) && 0 <= bet && bet <= 24,
        ) ||
        !isArrayUnique(userBets)
      )
        return res
          .status(400)
          .json({ success: false, message: "Invalid parameters" });

      if (amount < minGameAmount)
        return res.status(400).json({
          success: false,
          message: "Invalid bet amount",
        });

      const maxStrikeMultiplier = 25;
      const maxPayout = Decimal.mul(amount, maxStrikeMultiplier);

      if (
        !(
          maxPayout.toNumber() <=
          maxPayouts[splToken.tokenMint as GameTokens].mines
        )
      )
        return res
          .status(400)
          .json({ success: false, message: "Max payout exceeded" });

      await connectDatabase();

      const user = await User.findOneAndUpdate(
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

      if (!user) {
        throw new Error("Insufficient balance for action!!");
      }

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

      let result = userBets.some((bet) => strikeNumbers.at(bet) === 1)
        ? "Lost"
        : "Won";

      const numBets = userBets.length;

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
        launchPromoEdge || isFomoToken
          ? 0
          : houseEdgeTiers[parseInt(stakingTier)];

      let strikeMultiplier = 0,
        amountWon = 0,
        amountLost = amount,
        feeGenerated = 0;

      const addGame = !user.gamesPlayed.includes(GameType.mines);

      if (result === "Won") {
        strikeMultiplier = 1;

        for (let i = 0; i < numBets; i++)
          strikeMultiplier = Decimal.div(25 - i, 25 - i - minesCount)
            .mul(strikeMultiplier)
            .toNumber();
        strikeMultiplier = Math.min(strikeMultiplier, maxStrikeMultiplier);

        amountWon = Decimal.mul(amount, strikeMultiplier)
          .mul(Decimal.sub(1, houseEdge))
          .toNumber();
        amountLost = 0;

        feeGenerated = Decimal.mul(amount, strikeMultiplier)
          .sub(amountWon)
          .toNumber();

        result = amountWon > amount ? "Won" : "Lost";

        await User.findOneAndUpdate(
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
              "deposit.$.amount": amountWon,
            },
            ...(addGame ? { $addToSet: { gamesPlayed: GameType.mines } } : {}),
          },
        );
      }

      const record = await Mines.findOneAndUpdate(
        { wallet, result: "Pending" },
        {
          $setOnInsert: {
            wallet,
            amount,
            minesCount,
            strikeMultiplier,
            strikeNumbers,
            userBets,
            houseEdge,
            result,
            tokenMint,
            amountWon,
            amountLost,
            nonce,
            gameSeed: activeGameSeed._id,
          },
        },
        { upsert: true, new: true },
      ).populate("gameSeed");

      if (record?.nonce !== nonce)
        return res
          .status(400)
          .json({ success: false, message: "Pending game found!" });

      await updateGameStats(
        wallet,
        GameType.mines,
        tokenMint,
        amount,
        addGame,
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

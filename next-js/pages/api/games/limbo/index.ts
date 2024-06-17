import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { GameSeed, Limbo, User } from "@/models/games";
import {
  generateGameResult,
  GameType,
  seedStatus,
  decryptServerSeed,
  GameTokens,
} from "@/utils/provably-fair";
import StakingUser from "@/models/staking/user";
import {
  houseEdgeTiers,
  maxPayouts,
  minAmtFactor,
  pointTiers,
  stakingTiers,
} from "@/context/config";
import { launchPromoEdge } from "@/context/config";
import { minGameAmount, wsEndpoint, maintainance } from "@/context/config";
import { Decimal } from "decimal.js";
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
  amount: number;
  tokenMint: string;
  multiplier: number;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, amount, tokenMint, multiplier }: InputType = req.body;

      if (maintainance)
        return res.status(400).json({
          success: false,
          message: "Under maintenance",
        });

      const minGameAmount =
        maxPayouts[tokenMint as GameTokens]["limbo" as GameType] * minAmtFactor;

      const token = await getToken({ req, secret });

      if (!token || !token.sub || token.sub != wallet)
        return res.status(400).json({
          success: false,
          message: "User wallet not authenticated",
        });

      if (!wallet || !amount || !tokenMint || !multiplier)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      const splToken = SPL_TOKENS.find((t) => t.tokenMint === tokenMint);
      if (
        typeof amount !== "number" ||
        !isFinite(amount) ||
        !splToken ||
        !(1.02 <= multiplier && multiplier <= 50)
      )
        return res
          .status(400)
          .json({ success: false, message: "Invalid parameters" });

      if (amount < minGameAmount)
        return res.status(400).json({
          success: false,
          message: "Invalid bet amount",
        });

      const strikeMultiplier = multiplier;
      const maxPayout = Decimal.mul(amount, strikeMultiplier);

      if (!(maxPayout.toNumber() <= maxPayouts[tokenMint as GameTokens].limbo))
        return res
          .status(400)
          .json({ success: false, message: "Max payout exceeded" });

      await connectDatabase();

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

      const strikeNumber = generateGameResult(
        serverSeed,
        clientSeed,
        nonce,
        GameType.limbo,
      );

      if (!strikeNumber) throw new Error("Invalid strike number!");

      let result = "Lost";
      let amountWon = new Decimal(0);
      let amountLost = amount;
      let feeGenerated = 0;

      const chance = new Decimal(100).div(strikeMultiplier).toNumber();

      if (strikeMultiplier <= strikeNumber) {
        result = "Won";
        amountWon = Decimal.mul(amount, strikeMultiplier).mul(
          Decimal.sub(1, houseEdge),
        );
        amountLost = Math.max(new Decimal(amount).sub(amountWon).toNumber(), 0);

        feeGenerated = Decimal.mul(amount, strikeMultiplier)
          .mul(houseEdge)
          .toNumber();
      }

      const addGame = !user.gamesPlayed.includes(GameType.limbo);

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
            "deposit.$.amount": amountWon.sub(amount),
            numOfGamesPlayed: 1,
          },
          ...(addGame ? { $addToSet: { gamesPlayed: GameType.limbo } } : {}),
        },
        {
          new: true,
        },
      );

      if (!userUpdate) {
        throw new Error("Insufficient balance for action!!");
      }

      const limbo = new Limbo({
        wallet,
        amount,
        chance,
        strikeNumber,
        strikeMultiplier,
        result,
        tokenMint,
        houseEdge,
        amountWon,
        amountLost,
        nonce,
        gameSeed: activeGameSeed._id,
      });
      await limbo.save();

      await updateGameStats(
        wallet,
        GameType.limbo,
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

      const record = await Limbo.populate(limbo, "gameSeed");
      const { gameSeed, ...rest } = record.toObject();
      rest.game = GameType.limbo;
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

      return res.status(201).json({
        success: true,
        message:
          result === "Won"
            ? "Congratulations! You won!"
            : "Better luck next time!",
        result,
        strikeNumber,
        amountWon: amountWon.toNumber(),
        amountLost,
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

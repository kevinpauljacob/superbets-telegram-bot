import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { GameSeed, Plinko, User } from "@/models/games";
import {
  generateGameResult,
  GameType,
  seedStatus,
  GameTokens,
} from "@/utils/provably-fair";
import StakingUser from "@/models/staking/user";
import {
  houseEdgeTiers,
  maintainance,
  maxPayouts,
  minAmtFactor,
  pointTiers,
} from "@/context/config";
import { launchPromoEdge } from "@/context/config";
import { minGameAmount, wsEndpoint } from "@/context/config";
import { Decimal } from "decimal.js";
Decimal.set({ precision: 9 });

const secret = process.env.NEXTAUTH_SECRET;

export const config = {
  maxDuration: 60,
};

type InputType = {
  wallet: string;
  amount: number;
  tokenMint: string;
  rows: number;
  risk: "low" | "medium" | "high";
};

type RiskToChance = Record<string, Record<number, Array<number>>>;

const riskToChance: RiskToChance = {
  low: {
    8: [6.9, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 6.9],
    9: [8.2, 2, 1.6, 1, 0.7, 0.7, 1, 1.6, 2, 8.2],
    10: [14, 3, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 3, 14],
    11: [18.6, 3, 1.9, 1.3, 1, 0.7, 0.7, 1, 1.3, 1.9, 3, 18.6],
    12: [30.9, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 30.9],
    13: [49.1, 4, 3, 1.9, 1.2, 0.9, 0.7, 0.7, 0.9, 1.2, 1.9, 3, 4, 49.1],
    14: [89, 4, 1.9, 1.4, 1.3, 1.1, 1, 0.5, 1, 1.1, 1.3, 1.4, 1.9, 4, 89],
    15: [178.7, 8, 3, 2, 1.5, 1.1, 1, 0.7, 0.7, 1, 1.1, 1.5, 2, 3, 8, 178.7],
    16: [
      344.1, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9,
      344.1,
    ],
  },
  medium: {
    8: [14.4, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 14.4],
    9: [20.2, 4, 1.7, 0.9, 0.5, 0.5, 0.9, 1.7, 4, 20.2],
    10: [27.6, 5, 2, 1.4, 0.6, 0.4, 0.6, 1.4, 2, 5, 27.6],
    11: [34, 6, 3, 1.8, 0.7, 0.5, 0.5, 0.7, 1.8, 3, 6, 34],
    12: [53.7, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 53.7],
    13: [84.2, 13, 6, 3, 1.3, 0.7, 0.4, 0.4, 0.7, 1.3, 3, 6, 13, 84.2],
    14: [140.4, 15, 7, 4, 1.9, 1, 0.5, 0.2, 0.5, 1, 1.9, 4, 7, 15, 140.4],
    15: [
      252.1, 18, 11, 5, 3, 1.3, 0.5, 0.3, 0.3, 0.5, 1.3, 3, 5, 11, 18, 252.1,
    ],
    16: [
      441.5, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 441.5,
    ],
  },
  high: {
    8: [30.2, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 30.2],
    9: [45.4, 7, 2, 0.6, 0.2, 0.2, 0.6, 2, 7, 45.4],
    10: [80.8, 10, 3, 0.9, 0.3, 0.2, 0.3, 0.9, 3, 10, 80.8],
    11: [128.6, 14, 5.2, 1.4, 0.4, 0.2, 0.2, 0.4, 1.4, 5.2, 14, 128.6],
    12: [188.1, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 188.1],
    13: [297.4, 37, 11, 4, 1, 0.2, 0.2, 0.2, 0.2, 1, 4, 11, 37, 297.4],
    14: [503.7, 56, 18, 5, 1.9, 0.3, 0.2, 0.2, 0.2, 0.3, 1.9, 5, 18, 56, 503.7],
    15: [
      779.5, 83, 27, 8, 3, 0.5, 0.2, 0.2, 0.2, 0.2, 0.5, 3, 8, 27, 83, 779.5,
    ],
    16: [
      1335.4, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130,
      1335.4,
    ],
  },
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, amount, tokenMint, rows, risk }: InputType = req.body;

      const token = await getToken({ req, secret });

      if (!token || !token.sub || token.sub != wallet)
        return res.status(400).json({
          success: false,
          message: "User wallet not authenticated",
        });

      if (maintainance)
        return res.status(400).json({
          success: false,
          message: "Under maintenance",
        });

      const minGameAmount =
        maxPayouts[tokenMint as GameTokens]["plinko" as GameType] *
        minAmtFactor;

      if (!wallet || !amount || tokenMint !== "SOL" || !rows || !risk)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      if (amount < minGameAmount)
        return res.status(400).json({
          success: false,
          message: "Invalid bet amount",
        });
      if (
        tokenMint !== "SOL" ||
        //TODO: change rows depending on ui
        !(
          Number.isInteger(rows) &&
          [8, 9, 10, 11, 12, 13, 14, 15, 16].includes(rows)
        ) ||
        !(
          risk.toLowerCase() === "low" ||
          risk.toLowerCase() === "medium" ||
          risk.toLowerCase() === "high"
        )
      )
        return res
          .status(400)
          .json({ success: false, message: "Invalid parameters" });

      const multiplier = riskToChance[risk][rows];
      const maxStrikeMultiplier = multiplier.at(-1)!;
      const maxPayout = Decimal.mul(amount, maxStrikeMultiplier);

      if (!(maxPayout.toNumber() <= maxPayouts[tokenMint].plinko))
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
      const userTier = userData?.tier ?? 0;
      const houseEdge = launchPromoEdge ? 0 : houseEdgeTiers[userTier];

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

      const { serverSeed, clientSeed, nonce } = activeGameSeed;

      const strikeNumber = generateGameResult(
        serverSeed,
        clientSeed,
        nonce,
        GameType.plinko,
        rows,
      );

      let strikeMultiplier = 1;
      for (
        let i = 1, chance = 1, totalChance = chance;
        i <= rows;
        chance = (chance * (rows - i + 1)) / i, totalChance += chance, ++i
      ) {
        if (strikeNumber <= totalChance) {
          strikeMultiplier = multiplier[i - 1];
          break;
        }
      }
      /*
      chance = 1, totalChance = 1, i = 1
      chance = 1 * 8 / 1 = 8, totalChance = 9, i = 2
      chance = 8 * 7 / 2 = 28, totalChance = 37, i = 3
      chance = 28 * 6 / 3 = 56, totalChance = 93, i = 4
      chance = 56 * 5 / 4 = 70, totalChance = 163, i = 5
      */

      const amountWon = Decimal.mul(amount, strikeMultiplier).mul(
        Decimal.sub(1, houseEdge),
      );
      const amountLost = Math.max(
        new Decimal(amount).sub(amountWon).toNumber(),
        0,
      );

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
        },
        {
          new: true,
        },
      );

      if (!userUpdate) {
        throw new Error("Insufficient balance for action!!");
      }

      const result = amountWon.toNumber() > amount ? "Won" : "Lost";
      const plinko = new Plinko({
        wallet,
        amount,
        rows,
        risk,
        strikeNumber,
        strikeMultiplier,
        tokenMint,
        houseEdge,
        result,
        amountWon,
        amountLost,
        nonce,
        gameSeed: activeGameSeed._id,
      });
      await plinko.save();

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

      const record = await Plinko.populate(plinko, "gameSeed");
      const { gameSeed, ...rest } = record.toObject();
      rest.game = GameType.plinko;
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
          ? `Congratulations! You won ${amountWon}!`
          : `Sorry, Better luck next time!`;

      return res.status(201).json({
        success: true,
        message,
        result,
        strikeMultiplier,
        strikeNumber,
        amountWon: amountWon.toNumber(),
        amountLost,
        rows,
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

import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { GameSeed, Mines, User } from "@/models/games";
import { GameTokens, GameType, seedStatus } from "@/utils/provably-fair";
import { wsEndpoint } from "@/context/config";
import Decimal from "decimal.js";
import { maxPayouts, minAmtFactor, maintainance } from "@/context/config";
import StakingUser from "@/models/staking/user";
import { SPL_TOKENS } from "@/context/config";
import updateGameStats from "../../../../utils/updateGameStats";

const secret = process.env.NEXTAUTH_SECRET;

export const config = {
  maxDuration: 60,
};

type InputType = {
  wallet: string;
  amount: number;
  tokenMint: string;
  minesCount: number;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      return res.status(400).json({
        success: false,
        message: "Endpoint disabled",
      });

      await connectDatabase();

      const pendingGames = await Mines.find({
        result: "Pending",
      });

      await GameSeed.updateMany(
        {},
        {
          $set: {
            pendingMines: false,
          },
        },
      );

      await GameSeed.updateMany(
        {
          _id: { $in: pendingGames.map((g) => g.gameSeed) },
        },
        {
          $set: {
            pendingMines: true,
          },
        },
      );

      return res.status(201).json({
        success: true,
        message: "Field added",
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

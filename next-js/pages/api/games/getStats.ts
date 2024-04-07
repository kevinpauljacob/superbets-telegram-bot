import connectDatabase from "../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { Coin, Dice, Option } from "@/models/games";
import { GameType } from "@/utils/vrf";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      // Get the game type from the query
      const game = req.query.game as string;

      if (!Object.entries(GameType).some(([_, value]) => value === game))
        return res
          .status(400)
          .json({ success: false, message: "Invalid game type" });

      await connectDatabase();

      //count the unique wallets and aggregate amount field from Model
      let stats;
      switch (game) {
        case GameType.coin:
          stats = await Coin.aggregate([
            {
              $group: {
                _id: null,
                volume: { $sum: "$amount" },
                players: { $addToSet: "$wallet" },
              },
            },
            {
              $addFields: {
                players: { $size: "$players" },
              },
            },
          ]).then((res) => res[0]);
        case GameType.dice:
          stats = await Dice.aggregate([
            {
              $group: {
                _id: null,
                volume: { $sum: "$amount" },
                players: { $addToSet: "$wallet" },
              },
            },
            {
              $addFields: {
                players: { $size: "$players" },
              },
            },
          ]).then((res) => res[0]);
          break;
        case GameType.options:
          stats = await Option.aggregate([
            {
              $group: {
                _id: null,
                volume: { $sum: "$amount" },
                players: { $addToSet: "$wallet" },
              },
            },
            {
              $addFields: {
                players: { $size: "$players" },
              },
            },
          ]).then((res) => res[0]);
          break;
      }

      return res.json({
        success: true,
        stats,
        message: `Data fetch successful !`,
      });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}

export default handler;

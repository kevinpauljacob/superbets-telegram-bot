import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { gameModelMap } from "@/models/games";
import { GameType } from "@/utils/provably-fair";

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

      const model = gameModelMap[game as keyof typeof gameModelMap];

      //count the unique wallets and aggregate amount field from Model
      const stats = await model
        .aggregate([
          {
            $group: {
              _id: null,
              volume: { $sum: "$amount" },
              wallets: { $addToSet: "$wallet" },
            },
          },
          {
            $addFields: {
              players: { $size: "$wallets" },
            },
          },
          {
            $project: {
              wallets: 0,
            },
          },
        ])
        .then((res) => res[0]);

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

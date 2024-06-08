import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { GameStats, User } from "@/models/games";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      await connectDatabase();

      const gameStats = await GameStats.find().lean();

      // Calculate the total volume and total unique players
      const totalVolumes: Record<string, number> = {};
      const totalPlayers = await User.aggregate([
        {
          $group: {
            _id: null,
            players: { $addToSet: "$wallet" },
          },
        },
        {
          $addFields: {
            totalPlayers: { $size: "$wallets" },
          },
        },
      ]).then((res) => res[0].totalPlayers);

      gameStats.forEach((stat) => {
        Object.keys(stat.volume).forEach((key) => {
          if (totalVolumes[key]) {
            totalVolumes[key] += stat.volume[key];
          } else {
            totalVolumes[key] = stat.volume[key];
          }
        });
      });

      return res.json({
        success: true,
        stats: {
          totalVolumes,
          totalPlayers,
          gameStats,
        },
        message: `Data fetch successful!`,
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

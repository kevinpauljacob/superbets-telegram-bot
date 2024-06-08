import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import Stats from "@/models/games/gameStats";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      // await fetch("/api/games/global/backfill-stats");
      await connectDatabase();

      const stats = await Stats.find({}).lean();

      // Calculate the total volume and total unique players
      const totalVolumes = {
        SOL: 0,
        EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 0,
        Cx9oLynYgC3RrgXzin7U417hNY9D6YB1eMGw4ZMbWJgw: 0,
      };
      const allUsers = new Set<string>();

      stats.forEach((game) => {
        if (game.volume) {
          totalVolumes.SOL += game.volume.SOL;
          totalVolumes.EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v +=
            game.volume.EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v;
          totalVolumes.Cx9oLynYgC3RrgXzin7U417hNY9D6YB1eMGw4ZMbWJgw +=
            game.volume.Cx9oLynYgC3RrgXzin7U417hNY9D6YB1eMGw4ZMbWJgw;
        }
        game.wallets.forEach((wallet: string) => allUsers.add(wallet));
      });

      const totalPlayers = allUsers.size;

      return res.json({
        success: true,
        stats: {
          totalVolumes,
          totalPlayers,
          games: stats,
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

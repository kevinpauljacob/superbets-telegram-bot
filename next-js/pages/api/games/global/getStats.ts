import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { gameModelMap } from "@/models/games";
import { GameType } from "@/utils/provably-fair";
import Stats from "@/models/games/gameStats";

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

      const stats = await Stats.find({}).lean();

      const gameStats = stats.find((item) => item?.game === game);

      if (!gameStats)
        return res
          .status(400)
          .json({ success: false, message: "Stat not found!" });

      return res.json({
        success: true,
        stats: gameStats,
        message: `Data fetch successful !`,
      });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}

export default handler;

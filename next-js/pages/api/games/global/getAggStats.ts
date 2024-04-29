import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { gameModelMap, User } from "@/models/games";
import { GameType } from "@/utils/provably-fair";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      await connectDatabase();

      let totalVolume = 0;
      let totalPlayers = 0;

      for (const [_, value] of Object.entries(GameType)) {
        const game = value;
        const model = gameModelMap[game as keyof typeof gameModelMap];

        const stats = await model
          .aggregate([
            {
              $group: {
                _id: null,
                volume: { $sum: "$amount" },
              },
            },
          ])
          .then((res) => res[0]);

        if (stats?.volume) totalVolume += stats.volume;
      }

      await User.aggregate([
        {
          $group: {
            _id: null,
            players: { $sum: 1 },
          },
        },
      ]).then((res) => {
        totalPlayers = res[0].players;
      });

      return res.json({
        success: true,
        stats: {
          totalVolume,
          totalPlayers,
        },
        message: `Data fetch successful !`,
      });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}

export default handler;

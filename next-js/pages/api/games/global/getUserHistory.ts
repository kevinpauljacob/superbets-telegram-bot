import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { gameModelMap } from "@/models/games";
import { GameType, seedStatus } from "@/utils/provably-fair";

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

      const wallet = req.query.wallet;

      const model = gameModelMap[game as keyof typeof gameModelMap];

      let nonExpired = await model.find(
        { wallet, "gameSeed.status": { $ne: seedStatus.EXPIRED } },
        { "gameSeed.serverSeed": 0 },
        { populate: { path: "gameSeed" } },
      );

      let expired = await model.find(
        { wallet, "gameSeed.status": seedStatus.EXPIRED },
        {},
        { populate: { path: "gameSeed" } },
      );

      const data = [...nonExpired, ...expired].sort(
        (a: any, b: any) => b.createdAt - a.createdAt,
      );

      return res.json({
        success: true,
        data,
        message: `Data fetch successful !`,
      });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}

export default handler;

import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { gameModelMap, User } from "@/models/games";
import { GameType, seedStatus } from "@/utils/provably-fair";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const wallet = req.query.wallet;

      if (!wallet)
        return res
          .status(400)
          .json({ success: false, message: "Invalid wallet" });

      await connectDatabase();

      const user = await User.findOne({ wallet });
      if (!user)
        return res.json({ success: true, data: [], message: "No data found" });

      const data: any[] = [];

      for (const [_, value] of Object.entries(GameType)) {
        const game = value;
        if (game === GameType.options) continue;

        const model = gameModelMap[game as keyof typeof gameModelMap];

        const records = await model
          .find({ wallet })
          .populate({
            path: "gameSeed",
          })
          .sort({ createdAt: -1 })
          .limit(30);

        const resultsWithGame = records.map((record) => {
          const { gameSeed, ...rest } = record.toObject();

          rest.game = game;

          if (gameSeed.status !== seedStatus.EXPIRED) {
            rest.gameSeed = { ...gameSeed, serverSeed: undefined };
          } else {
            rest.gameSeed = { ...gameSeed };
          }

          return rest;
        });

        data.push(...resultsWithGame);
      }

      data.sort((a: any, b: any) => {
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

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

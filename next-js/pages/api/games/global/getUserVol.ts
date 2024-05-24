import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { gameModelMap, User } from "@/models/games";
import { GameType } from "@/utils/provably-fair";

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

      let totalVolume = 0;

      for (const [_, value] of Object.entries(GameType)) {
        const game = value;
        const model = gameModelMap[game as keyof typeof gameModelMap];

        const res = await model.aggregate([
          {
            $match: {
              wallet,
            },
          },
          {
            $group: {
              _id: null,
              amount: { $sum: "$amount" },
            },
          },
        ]);

        if (res.length > 0) {
          totalVolume += res[0].amount;
        }
      }

      return res.json({
        success: true,
        data: totalVolume,
        message: `Data fetch successful !`,
      });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}

export default handler;

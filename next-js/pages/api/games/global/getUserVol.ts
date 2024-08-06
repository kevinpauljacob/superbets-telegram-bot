import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { gameModelMap, User } from "@/models/games";
import { GameType } from "@/utils/provably-fair";
import { SPL_TOKENS } from "@/context/config";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      return res.json({
        success: false,
        message: "This endpoint is disabled.",
      });

      const wallet = req.query.wallet;
      const tokenMint = req.query.tokenMint;

      if (!wallet)
        return res
          .status(400)
          .json({ success: false, message: "Invalid wallet" });

      if (!SPL_TOKENS.some((t) => t.tokenMint === tokenMint))
        return res
          .status(400)
          .json({ success: false, message: "Invalid token mint" });

      await connectDatabase();

      const user = await User.findOne({ wallet });
      if (!user)
        return res.json({ success: true, data: 0, message: "No data found" });

      let totalVolume = 0;

      for (const [_, value] of Object.entries(GameType)) {
        const game = value;
        const model = gameModelMap[game as keyof typeof gameModelMap];

        const res = await model.aggregate([
          {
            $match: {
              wallet,
              tokenMint,
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
  } else
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
}

export default handler;

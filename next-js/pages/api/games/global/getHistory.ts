import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { GameType, seedStatus } from "@/utils/provably-fair";
import StakingUser from "@/models/staking/user";
import { gameModelMap } from "@/models/games";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      await connectDatabase();

      const data: any[] = [];

      for (const [_, value] of Object.entries(GameType)) {
        const game = value;
        if (game === GameType.options) continue;

        const model = gameModelMap[game as keyof typeof gameModelMap];

        const nonExpired = await model
          .find(
            { "gameSeed.status": { $ne: seedStatus.EXPIRED } },
            { "gameSeed.serverSeed": 0 },
            { populate: { path: "gameSeed" } },
          )
          .sort({ createdAt: -1 })
          .limit(25);

        const nonExpiredWithGame = nonExpired.map((record) => ({
          ...record._doc,
          game,
        }));

        const expired = await model
          .find(
            { "gameSeed.status": seedStatus.EXPIRED },
            {},
            { populate: { path: "gameSeed" } },
          )
          .sort({ createdAt: -1 })
          .limit(25);

        const expiredWithGame = expired.map((record) => ({
          ...record._doc,
          game,
        }));

        data.push(...nonExpiredWithGame, ...expiredWithGame);
      }

      data.sort((a: any, b: any) => {
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      const wallets: string[] = Array.from(
        new Set(data.map((doc: any) => doc.wallet)),
      );

      const userData = await StakingUser.find({
        wallet: { $in: wallets },
      }).select("wallet tier");

      const userTiers = userData.reduce((acc, user) => {
        acc[user.wallet] = user.tier;
        return acc;
      }, {});

      data.forEach((doc: any) => {
        doc.userTier = userTiers[doc.wallet] ?? 0;
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

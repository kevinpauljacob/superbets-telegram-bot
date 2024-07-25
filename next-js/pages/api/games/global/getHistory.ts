import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { GameType, decryptServerSeed, seedStatus } from "@/utils/provably-fair";
import StakingUser from "@/models/staking/user";
import { User, gameModelMap } from "@/models/games";

const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      await connectDatabase();

      const data: any[] = [];

      for (const [_, value] of Object.entries(GameType)) {
        const game = value;
        const model = gameModelMap[game as keyof typeof gameModelMap];

        if (game === GameType.options) {
          const records = await model.find().sort({ createdAt: -1 }).limit(20);

          const resultsWithGame = await Promise.all(
            records.map(async (record) => {
              const { ...rest } = record.toObject();
              let user = await User.findById(rest.account);
              if (user) rest.account = user?.name ?? user?.wallet;
              rest.game = game;

              return rest;
            }),
          );

          data.push(...resultsWithGame);
        } else {
          const records = await model
            .find()
            .populate({
              path: "gameSeed",
            })
            .sort({ createdAt: -1 })
            .limit(20);

          const resultsWithGame = await Promise.all(
            records.map(async (record) => {
              const { gameSeed, ...rest } = record.toObject();
              let user = await User.findById(rest.account);
              if (user) rest.account = user?.name ?? user?.wallet;

              rest.game = game;

              if (gameSeed.status !== seedStatus.EXPIRED) {
                rest.gameSeed = { ...gameSeed, serverSeed: undefined };
              } else {
                const serverSeed = decryptServerSeed(
                  gameSeed.serverSeed,
                  encryptionKey,
                  Buffer.from(gameSeed.iv, "hex"),
                );
                rest.gameSeed = { ...gameSeed, serverSeed };
              }

              return rest;
            }),
          );

          data.push(...resultsWithGame);
        }
      }

      data.sort((a: any, b: any) => {
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      const wallets: string[] = Array.from(
        new Set(data.map((doc: any) => doc?.account)),
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

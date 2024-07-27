import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { gameModelMap, User } from "@/models/games";
import { GameType, decryptServerSeed, seedStatus } from "@/utils/provably-fair";

const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const wallet = req?.query?.wallet;
      const email = req?.query?.email;

      if (!wallet && !email)
        return res
          .status(400)
          .json({ success: false, message: "Invalid wallet" });

      await connectDatabase();

      let user: any = null;
      if (wallet) {
        user = await User.findOne({
          wallet: wallet,
        });
      } else if (email) {
        user = await User.findOne({
          email: email,
        });
      }

      if (!user)
        return res.json({ success: true, data: [], message: "No data found" });

      const account = user._id;
      const data: any[] = [];

      for (const [_, value] of Object.entries(GameType)) {
        const game = value;
        const model = gameModelMap[game as keyof typeof gameModelMap];

        if (game === GameType.options) {
          const records = await model
            .find({ account })
            .sort({ createdAt: -1 })
            .limit(30);

          const resultsWithGame = records.map((record) => {
            const { ...rest } = record.toObject();
            rest.account = user?.name ?? user?.wallet;
            rest.game = game;
            return rest;
          });

          data.push(...resultsWithGame);
        } else {
          const records = await model
            .find({ account })
            .populate({
              path: "gameSeed",
            })
            .sort({ createdAt: -1 })
            .limit(30);

          const resultsWithGame = records.map((record) => {
            const { gameSeed, ...rest } = record.toObject();
            rest.account = user?.name ?? user?.wallet;
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
          });

          data.push(...resultsWithGame);
        }
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

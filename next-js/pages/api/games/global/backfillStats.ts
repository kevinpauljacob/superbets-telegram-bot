import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import GameStats from "@/models/games/gameStats";
import { GameType } from "@/utils/provably-fair";
import { gameModelMap } from "@/models/games";
import GameUser from "@/models/games/gameUser";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      return res.status(400).json({
        success: false,
        message: "This endpoint is disabled.",
      });

      await connectDatabase();

      for (const [_, value] of Object.entries(GameType)) {
        const game = value;
        const model = gameModelMap[game as keyof typeof gameModelMap];

        const volStats = await model.aggregate([
          {
            $group: {
              _id: "$tokenMint",
              volume: { $sum: "$amount" },
            },
          },
        ]);
        const walletStats = await model
          .aggregate([
            {
              $group: {
                _id: null,
                wallets: { $addToSet: "$wallet" },
              },
            },
            {
              $addFields: {
                numOfWallets: { $size: "$wallets" },
              },
            },
          ])
          .then((res) => res[0]);

        if (!walletStats?.numOfWallets) continue;

        await GameUser.updateMany(
          {
            wallet: { $in: walletStats.wallets },
          },
          {
            $addToSet: {
              gamesPlayed: game,
            },
          },
        );

        const gameStats: {
          game: string;
          volume: { [key: string]: number };
          numOfWallets: number;
        } = {
          game,
          volume: {},
          numOfWallets: walletStats.numOfWallets,
        };

        volStats.forEach((stat) => {
          gameStats.volume[stat._id] = stat.volume;
        });

        await GameStats.create(gameStats);
      }

      return res.json({
        success: true,
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

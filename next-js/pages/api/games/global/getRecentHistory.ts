import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { gameModelMap } from "@/models/games";
import { GameType } from "@/utils/provably-fair";
import StakingUser from "@/models/staking/user";
import { pointTiers } from "@/context/transactions";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      await connectDatabase();

      const allGames: {
        game: GameType;
        wallet: string;
        amount: number;
        amountWon: number;
        result: string;
        createdAt: any;
      }[] = [];

      for (const [_, value] of Object.entries(GameType)) {
        const game = value;
        const model = gameModelMap[game as keyof typeof gameModelMap];

        const gameInfo = (
          await model.find({ result: "Won" }).sort({ createdAt: -1 }).limit(10)
        ).map((record) => {
          const { wallet, amount, amountWon, result, createdAt } = record;
          return {
            game,
            wallet,
            amount,
            amountWon,
            result,
            createdAt,
          };
        });

        allGames.push(...gameInfo);
      }

      const sortedGames = allGames
        .sort((a: any, b: any) => {
          return b.createdAt.getTime() - a.createdAt.getTime();
        })
        .slice(0, 15);

      const wallets = Array.from(
        new Set(sortedGames.map((doc: any) => doc.wallet)),
      );

      const userData = await StakingUser.find({
        wallet: { $in: wallets },
      }).select("wallet tier");

      const userTiers = userData.reduce((acc, user) => {
        acc[user.wallet] = user.tier;
        return acc;
      }, {});

      sortedGames.forEach((doc: any) => {
        doc.userTier = userTiers[doc.wallet] ?? 0;
      });

      return res.json({
        success: true,
        data: sortedGames,
        message: `Data fetch successful !`,
      });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}

export default handler;

import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { gameModelMap, User } from "@/models/games";
import { GameType } from "@/utils/provably-fair";
import StakingUser from "@/models/staking/user";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      await connectDatabase();

      const allGames: {
        game: GameType;
        account: any;
        amount: number;
        amountWon: number;
        result: string;
        tokenMint: string;
        createdAt: any;
      }[] = [];

      for (const [_, value] of Object.entries(GameType)) {
        const game = value;
        const model = gameModelMap[game as keyof typeof gameModelMap];

        const gameInfo = await Promise.all(
          (
            await model
              .find({ result: "Won" })
              .sort({ createdAt: -1 })
              .limit(10)
          ).map(async (record) => {
            const { account, amount, amountWon, result, createdAt, tokenMint } =
              record;

            let user = await User.findOne({ _id: account });

            return {
              game,
              account: user?.name ?? user?.wallet,
              amount,
              amountWon,
              result,
              tokenMint,
              createdAt,
            };
          }),
        );

        allGames.push(...gameInfo);
      }

      const sortedGames = allGames
        .sort((a: any, b: any) => {
          return b.createdAt.getTime() - a.createdAt.getTime();
        })
        .slice(0, 15);

      // const wallets = Array.from(
      //   new Set(sortedGames.map((doc: any) => doc.wallet)),
      // );

      // const userData = await StakingUser.find({
      //   wallet: { $in: wallets },
      // }).select("wallet tier");

      // const userTiers = userData.reduce((acc, user) => {
      //   acc[user.wallet] = user.tier;
      //   return acc;
      // }, {});

      // sortedGames.forEach((doc: any) => {
      //   doc.userTier = userTiers[doc.wallet] ?? 0;
      // });

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

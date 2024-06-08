import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { gameModelMap, User, Stats } from "@/models/games";
import { GameType } from "@/utils/provably-fair";

async function populateStats() {
  return;
  try {
    await connectDatabase();

    for (const [_, value] of Object.entries(GameType)) {
      const game = value;
      const model = gameModelMap[game as keyof typeof gameModelMap];

      const stats = await model.aggregate([
        {
          $group: {
            _id: "$tokenMint",
            volume: { $sum: "$amount" },
            wallets: { $addToSet: "$wallet" },
          },
        },
      ]);

      const gameStats = {
        game: game,
        volume: {
          SOL: 0,
          EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 0,
          Cx9oLynYgC3RrgXzin7U417hNY9D6YB1eMGw4ZMbWJgw: 0,
        },
        wallets: [] as string[],
      };

      stats.forEach((stat) => {
        //@ts-ignore
        gameStats.volume[stat._id] += stat.volume;
        gameStats.wallets = [
          ...new Set([...gameStats.wallets, ...stat.wallets]),
        ];
      });

      await Stats.findOneAndUpdate({ game }, gameStats, {
        upsert: true,
        new: true,
      });
    }

    console.log("Stats populated successfully!");
    mongoose.disconnect();
  } catch (err) {
    console.error("Error populating stats:", err);
  }
}

populateStats();

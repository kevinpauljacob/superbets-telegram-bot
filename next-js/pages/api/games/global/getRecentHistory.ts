import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import {
  Coin,
  Dice,
  Option,
  Dice2,
  Keno,
  Limbo,
  Plinko,
  Roulette1,
  Roulette2,
  Wheel,
} from "@/models/games";
import { GameType } from "@/utils/vrf";
import StakingUser from "@/models/staking/user";
import { pointTiers } from "@/context/transactions";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      await connectDatabase();

      const dice = (
        await Dice.find({ result: "Won" }).sort({ createdAt: -1 }).limit(10)
      ).map((record) => ({
        game: GameType.dice,
        wallet: record.wallet,
        absAmount: Math.abs(record.amountWon - record.amountLost),
        result: record.result,
        createdAt: record.createdAt,
      }));

      const coin = (
        await Coin.find({ result: "Won" }).sort({ createdAt: -1 }).limit(10)
      ).map((record) => ({
        game: GameType.coin,
        wallet: record.wallet,
        absAmount: Math.abs(record.amountWon - record.amountLost),
        result: record.result,
        createdAt: record.createdAt,
      }));

      const option = (
        await Option.find({ result: "Won" }).sort({ createdAt: -1 }).limit(10)
      ).map((record) => ({
        game: GameType.options,
        wallet: record.wallet,
        absAmount: Math.abs(record.amountWon - record.amountLost),
        result: record.result,
        createdAt: record.createdAt,
      }));

      const dice2 = (
        await Dice2.find({ result: "Won" }).sort({ createdAt: -1 }).limit(10)
      ).map((record) => ({
        game: GameType.dice2,
        wallet: record.wallet,
        absAmount: Math.abs(record.amountWon - record.amountLost),
        result: record.result,
        createdAt: record.createdAt,
      }));

      const keno = (
        await Keno.find({ result: "Won" }).sort({ createdAt: -1 }).limit(10)
      ).map((record) => ({
        game: GameType.keno,
        wallet: record.wallet,
        absAmount: Math.abs(record.amountWon - record.amountLost),
        result: record.result,
        createdAt: record.createdAt,
      }));

      const limbo = (
        await Limbo.find({ result: "Won" }).sort({ createdAt: -1 }).limit(10)
      ).map((record) => ({
        game: GameType.limbo,
        wallet: record.wallet,
        absAmount: Math.abs(record.amountWon - record.amountLost),
        result: record.result,
        createdAt: record.createdAt,
      }));

      const plinko = (
        await Plinko.find({ result: "Won" }).sort({ createdAt: -1 }).limit(10)
      ).map((record) => ({
        game: GameType.plinko,
        wallet: record.wallet,
        absAmount: Math.abs(record.amountWon - record.amountLost),
        result: record.result,
        createdAt: record.createdAt,
      }));

      const roulette1 = (
        await Roulette1.find({ result: "Won" })
          .sort({ createdAt: -1 })
          .limit(10)
      ).map((record) => ({
        game: GameType.roulette1,
        wallet: record.wallet,
        absAmount: Math.abs(record.amountWon - record.amountLost),
        result: record.result,
        createdAt: record.createdAt,
      }));

      const roulette2 = (
        await Roulette2.find({ result: "Won" })
          .sort({ createdAt: -1 })
          .limit(10)
      ).map((record) => ({
        game: GameType.roulette2,
        wallet: record.wallet,
        absAmount: Math.abs(record.amountWon - record.amountLost),
        result: record.result,
        createdAt: record.createdAt,
      }));

      const wheel = (
        await Wheel.find({ result: "Won" }).sort({ createdAt: -1 }).limit(10)
      ).map((record) => ({
        game: GameType.wheel,
        wallet: record.wallet,
        absAmount: Math.abs(Math.abs(record.amountWon - record.amountLost)),
        result: record.result,
        createdAt: record.createdAt,
      }));

      const allGames = [
        ...dice,
        ...coin,
        ...option,
        ...dice2,
        ...keno,
        ...limbo,
        ...plinko,
        ...roulette1,
        ...roulette2,
        ...wheel,
      ];

      const sortedGames = allGames.sort((a: any, b: any) => {
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      const wallets = Array.from(
        new Set(sortedGames.map((doc: any) => doc.wallet)),
      );

      const userData = await StakingUser.find({
        wallet: { $in: wallets },
      }).select("wallet points");

      const userTiers = userData.reduce((acc, user) => {
        acc[user.wallet] = Object.entries(pointTiers).reduce((prev, next) => {
          return user.points >= next[1].limit ? next : prev;
        })[0];
        return acc;
      }, {});

      sortedGames.forEach((doc: any) => {
        doc.userTier = userTiers[doc.wallet] ?? "0";
      });

      return res.json({
        success: true,
        data: sortedGames.slice(0, 10),
        message: `Data fetch successful !`,
      });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}

export default handler;

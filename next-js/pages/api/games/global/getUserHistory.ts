import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import {
  Coin,
  Dice,
  Dice2,
  Keno,
  Limbo,
  Mines,
  Option,
  Plinko,
  Roulette1,
  Roulette2,
  Wheel,
} from "@/models/games";
import { GameType, seedStatus } from "@/utils/provably-fair";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      // Get the game type from the query
      const game = req.query.game as string;

      if (!Object.entries(GameType).some(([_, value]) => value === game))
        return res
          .status(400)
          .json({ success: false, message: "Invalid game type" });

      await connectDatabase();

      const wallet = req.query.wallet;

      let nonExpired = [];
      let expired = [];

      switch (game) {
        case GameType.dice:
          nonExpired = await Dice.find(
            { wallet, "gameSeed.status": { $ne: seedStatus.EXPIRED } },
            { "gameSeed.serverSeed": 0 },
            { populate: { path: "gameSeed" } },
          );

          expired = await Dice.find(
            { wallet, "gameSeed.status": seedStatus.EXPIRED },
            {},
            { populate: { path: "gameSeed" } },
          );
          break;

        case GameType.coin:
          nonExpired = await Coin.find(
            { wallet, "gameSeed.status": { $ne: seedStatus.EXPIRED } },
            { "gameSeed.serverSeed": 0 },
            { populate: { path: "gameSeed" } },
          );

          expired = await Coin.find(
            { wallet, "gameSeed.status": seedStatus.EXPIRED },
            {},
            { populate: { path: "gameSeed" } },
          );
          break;

        case GameType.options:
          nonExpired = await Option.find({ wallet });
          break;

        case GameType.dice2:
          nonExpired = await Dice2.find(
            { wallet, "gameSeed.status": { $ne: seedStatus.EXPIRED } },
            { "gameSeed.serverSeed": 0 },
            { populate: { path: "gameSeed" } },
          );

          expired = await Dice2.find(
            { wallet, "gameSeed.status": seedStatus.EXPIRED },
            {},
            { populate: { path: "gameSeed" } },
          );
          break;

        case GameType.keno:
          nonExpired = await Keno.find(
            { wallet, "gameSeed.status": { $ne: seedStatus.EXPIRED } },
            { "gameSeed.serverSeed": 0 },
            { populate: { path: "gameSeed" } },
          );
          expired = await Keno.find(
            { wallet, "gameSeed.status": seedStatus.EXPIRED },
            {},
            { populate: { path: "gameSeed" } },
          );
          break;

        case GameType.limbo:
          nonExpired = await Limbo.find(
            { wallet, "gameSeed.status": { $ne: seedStatus.EXPIRED } },
            { "gameSeed.serverSeed": 0 },
            { populate: { path: "gameSeed" } },
          );
          expired = await Limbo.find(
            { wallet, "gameSeed.status": seedStatus.EXPIRED },
            {},
            { populate: { path: "gameSeed" } },
          );
          break;

        case GameType.plinko:
          nonExpired = await Plinko.find(
            { wallet, "gameSeed.status": { $ne: seedStatus.EXPIRED } },
            { "gameSeed.serverSeed": 0 },
            { populate: { path: "gameSeed" } },
          );
          expired = await Plinko.find(
            { wallet, "gameSeed.status": seedStatus.EXPIRED },
            {},
            { populate: { path: "gameSeed" } },
          );
          break;

        case GameType.roulette1:
          nonExpired = await Roulette1.find(
            { wallet, "gameSeed.status": { $ne: seedStatus.EXPIRED } },
            { "gameSeed.serverSeed": 0 },
            { populate: { path: "gameSeed" } },
          );
          expired = await Roulette1.find(
            { wallet, "gameSeed.status": seedStatus.EXPIRED },
            {},
            { populate: { path: "gameSeed" } },
          );
          break;

        case GameType.roulette2:
          nonExpired = await Roulette2.find(
            { wallet, "gameSeed.status": { $ne: seedStatus.EXPIRED } },
            { "gameSeed.serverSeed": 0 },
            { populate: { path: "gameSeed" } },
          );
          expired = await Roulette2.find(
            { wallet, "gameSeed.status": seedStatus.EXPIRED },
            {},
            { populate: { path: "gameSeed" } },
          );
          break;

        case GameType.wheel:
          nonExpired = await Wheel.find(
            { wallet, "gameSeed.status": { $ne: seedStatus.EXPIRED } },
            { "gameSeed.serverSeed": 0 },
            { populate: { path: "gameSeed" } },
          );
          expired = await Wheel.find(
            { wallet, "gameSeed.status": seedStatus.EXPIRED },
            {},
            { populate: { path: "gameSeed" } },
          );
          break;

        case GameType.mines:
          nonExpired = await Mines.find(
            { wallet, "gameSeed.status": { $ne: seedStatus.EXPIRED } },
            { "gameSeed.serverSeed": 0 },
            { populate: { path: "gameSeed" } },
          );
          expired = await Mines.find(
            { wallet, "gameSeed.status": seedStatus.EXPIRED },
            {},
            { populate: { path: "gameSeed" } },
          );
          break;

        case GameType.hilo:
          nonExpired = await Mines.find(
            { wallet, "gameSeed.status": { $ne: seedStatus.EXPIRED } },
            { "gameSeed.serverSeed": 0 },
            { populate: { path: "gameSeed" } },
          );
          expired = await Mines.find(
            { wallet, "gameSeed.status": seedStatus.EXPIRED },
            {},
            { populate: { path: "gameSeed" } },
          );
          break;
      }

      const data = [...nonExpired, ...expired].sort(
        (a: any, b: any) => b.createdAt - a.createdAt,
      );

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

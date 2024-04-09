import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { GameType } from "@/utils/vrf";
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

      let data;
      switch (game) {
        case GameType.dice:
          data = await Dice.find({}).sort({ createdAt: -1 }).limit(1000);
          break;
        case GameType.coin:
          data = await Coin.find({}).sort({ createdAt: -1 }).limit(1000);
          break;
        case GameType.options:
          data = await Option.find({}).sort({ createdAt: -1 }).limit(1000);
          break;
        case GameType.dice2:
          data = await Dice2.find({}).sort({ createdAt: -1 }).limit(1000);
          break;
        case GameType.keno:
          data = await Keno.find({}).sort({ createdAt: -1 }).limit(1000);
          break;
        case GameType.limbo:
          data = await Limbo.find({}).sort({ createdAt: -1 }).limit(1000);
          break;
        case GameType.plinko:
          data = await Plinko.find({}).sort({ createdAt: -1 }).limit(1000);
          break;
        case GameType.roulette1:
          data = await Roulette1.find({}).sort({ createdAt: -1 }).limit(1000);
          break;
        case GameType.roulette2:
          data = await Roulette2.find({}).sort({ createdAt: -1 }).limit(1000);
          break;
        case GameType.wheel:
          data = await Wheel.find({}).sort({ createdAt: -1 }).limit(1000);
          break;
      }

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

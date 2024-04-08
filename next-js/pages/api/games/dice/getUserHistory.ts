import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import Dice from "../../../../models/games/dice";
import { seedStatus } from "@/utils/vrf";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      await connectDatabase();

      const wallet = req.query.wallet;

      const nonExpiredDice = await Dice.find(
        { wallet, "gameSeed.status": { $ne: seedStatus.EXPIRED } },
        { "gameSeed.serverSeed": 0 },
        { populate: { path: "gameSeed" } },
      );

      const expiredDice = await Dice.find(
        { wallet, "gameSeed.status": seedStatus.EXPIRED },
        {},
        { populate: { path: "gameSeed" } },
      );

      let rolls = [...nonExpiredDice, ...expiredDice].sort(
        (a: any, b: any) => b.createdAt - a.createdAt,
      );

      return res.json({
        success: true,
        data: rolls,
        message: `Data fetch successful !`,
      });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}

export default handler;

import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import Coin from "../../../../models/games/coin";
import { seedStatus } from "@/utils/vrf";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      await connectDatabase();

      const wallet = req.query.wallet;

      const nonExpiredCoin = await Coin.find(
        { wallet, "gameSeed.status": { $ne: seedStatus.EXPIRED } },
        { "gameSeed.serverSeed": 0 },
        { populate: { path: "gameSeed" } },
      );

      const expiredCoin = await Coin.find(
        { wallet, "gameSeed.status": seedStatus.EXPIRED },
        {},
        { populate: { path: "gameSeed" } },
      );

      let flips = [...nonExpiredCoin, ...expiredCoin].sort(
        (a: any, b: any) => b.createdAt - a.createdAt,
      );

      return res.json({
        success: true,
        data: flips,
        message: `Data fetch successful !`,
      });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}

export default handler;

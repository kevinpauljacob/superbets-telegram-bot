import connectDatabase from "../../../../utils/database";
import { NextRequest } from "next/server";
import Flip from "../../../../models/games/flip";

async function handler(req: any, res: any) {
  if (req.method === "GET") {
    try {
      await connectDatabase();

      // const { searchParams } = req.nextUrl;
      // const wallet = searchParams.get("wallet");

      const wallet = req.query.wallet;

      let flips = (await Flip.find({ wallet })).reverse();

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

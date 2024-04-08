import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import Option from "../../../../models/games/option";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      await connectDatabase();

      // const { searchParams } = req.nextUrl;
      // const wallet = searchParams.get("wallet");

      const wallet = req.query.wallet;

      let bets = (await Option.find({ wallet })).reverse();

      return res.json({
        success: true,
        data: bets,
        message: `Data fetch successful !`,
      });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}

export default handler;

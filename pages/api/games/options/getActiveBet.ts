import connectDatabase from "../../../../utils/database";
import Bet from "../../../../models/games/bet";

async function handler(req: any, res: any) {
  if (req.method === "GET") {
    try {
      await connectDatabase();

      // const { searchParams } = req.nextUrl;
      // const wallet = searchParams.get("wallet");

      const wallet = req.query.wallet;

      let bets = await Bet.findOne({ wallet: wallet, result: "Pending" });

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

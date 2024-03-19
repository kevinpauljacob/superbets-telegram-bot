import connectDatabase from "../../../../utils/database";
import Flip from "../../../../models/games/flip";

async function handler(req: any, res: any) {
  if (req.method === "GET") {
    try {
      await connectDatabase();

      let flips = (await Flip.find({})).reverse().slice(0, 1000);

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

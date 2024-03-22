import connectDatabase from "../../../../utils/database";
import Roll from "../../../../models/games/dice";

async function handler(req: any, res: any) {
  if (req.method === "GET") {
    try {
      await connectDatabase();

      let rolls = (await Roll.find({})).reverse().slice(0, 1000);

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

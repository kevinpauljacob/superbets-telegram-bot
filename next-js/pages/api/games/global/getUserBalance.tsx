import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { Decimal } from "decimal.js";
import Deposit from "@/models/games/deposit";
Decimal.set({ precision: 9 });

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      await connectDatabase();

      const wallet = req.query.wallet;

      let balances = await Deposit.aggregate([
        {
          $match: {
            wallet,
          },
        },
        {
          $group: {
            _id: "$wallet",
            depositTotal: {
              $sum: {
                $cond: [{ $eq: ["$type", true] }, "$amount", 0],
              },
            },
            withdrawalTotal: {
              $sum: {
                $cond: [{ $eq: ["$type", false] }, "$amount", 0],
              },
            },
          },
        },
      ]);

      let netBalance = balances[0].depositTotal - balances[0].withdrawalTotal;

      const route = `http://localhost:3000/api/games/global/getUserPnl?wallet=${wallet}`;

      let pnl = (await (await fetch(route)).json())?.data ?? [];

      let totalBalance = netBalance + pnl;

      console.log(
        "netBalance: ",
        netBalance,
        "pnl: ",
        pnl,
        "totalBalance: ",
        totalBalance,
      );

      return res.json({
        success: true,
      });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  } else
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
}

export default handler;

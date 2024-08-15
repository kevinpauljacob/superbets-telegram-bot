import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { Decimal } from "decimal.js";
import Deposit from "@/models/games/deposit";
Decimal.set({ precision: 9 });

/**
 * @swagger
 * /games/global/getUserBalance:
 *   get:
 *     summary: Retrieves the net and total balance for a specified wallet
 *     description: Calculates the net balance by summing deposits and withdrawals. Fetches additional PnL data from another endpoint to compute the total balance.
 *     tags:
 *      - Games/Global
 *     parameters:
 *       - in: query
 *         name: wallet
 *         required: true
 *         schema:
 *           type: string
 *           example: "wallet_address_example"
 *         description: The wallet address for which the balance is to be calculated.
 *     responses:
 *       200:
 *         description: Successful balance retrieval
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Data fetch successful!"
 *       400:
 *         description: Bad Request - Missing or invalid query parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid wallet address or missing parameter"
 *       500:
 *         description: Internal Server Error - Failed to fetch or calculate balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error message details"
 *       405:
 *         description: Method Not Allowed - GET method required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Method not allowed"
 */

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      return res.json({
        success: false,
        message: "This endpoint is disabled.",
      });

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

      // console.log(
      //   "netBalance: ",
      //   netBalance,
      //   "pnl: ",
      //   pnl,
      //   "totalBalance: ",
      //   totalBalance,
      // );

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

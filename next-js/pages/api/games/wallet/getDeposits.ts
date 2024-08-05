import connectDatabase from "../../../../utils/database";
import Deposit from "../../../../models/games/deposit";
import { NextApiRequest, NextApiResponse } from "next";
import { SPL_TOKENS } from "@/context/config";

/**
 * @swagger
 * /api/games/wallet/getDeposit:
 *   get:
 *     summary: Get deposit history for a wallet
 *     description: Fetches the deposit history for a given wallet address.
 *     tags:
 *       - Game/Wallet
 *     parameters:
 *       - in: query
 *         name: wallet
 *         schema:
 *           type: string
 *         required: true
 *         description: The wallet address.
 *     responses:
 *       200:
 *         description: Successfully fetched deposit history.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tokenName:
 *                         type: string
 *                         description: Name of the token.
 *                       amount:
 *                         type: number
 *                         description: Amount deposited.
 *                       wallet:
 *                         type: string
 *                         description: Wallet address.
 *                       type:
 *                         type: boolean
 *                         description: Type of transaction (true for deposit).
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Timestamp of the deposit.
 *                 message:
 *                   type: string
 *       400:
 *         description: Wallet address is missing.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       405:
 *         description: Method not allowed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const wallet = req.query.wallet;

      if (!wallet)
        return res
          .status(400)
          .json({ success: false, message: "Wallet is required !" });

      await connectDatabase();

      let deposits = await Deposit.find(
        { wallet },
        {},
        { sort: { createdAt: -1 } },
      ).then((deposits) => {
        return deposits.map((deposit: any) => {
          const { tokenMint, ...rest } = deposit.toObject();
          const tokenName = SPL_TOKENS.find(
            (t) => t.tokenMint === deposit.tokenMint,
          )?.tokenName;

          return { tokenName, ...rest };
        });
      });

      return res.json({
        success: true,
        data: deposits,
        message: `Data fetch successful !`,
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

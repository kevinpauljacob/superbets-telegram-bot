import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { gameModelMap, User } from "@/models/games";
import { GameType } from "@/utils/provably-fair";
import { SPL_TOKENS } from "@/context/config";

/**
 * @swagger
 * /api/games/global/getUserVol:
 *   get:
 *     summary: Calculates the total transaction volume for a user
 *     description: Computes the total volume of transactions for a user based on their game records and a specified token mint. Aggregates data from different game types.
 *     tags:
 *      - Games/Global
 *     parameters:
 *       - in: query
 *         name: wallet
 *         required: true
 *         schema:
 *           type: string
 *           example: "wallet_address_example"
 *         description: The wallet address of the user.
 *       - in: query
 *         name: tokenMint
 *         required: true
 *         schema:
 *           type: string
 *           example: "token_mint_example"
 *         description: The token mint identifier to filter transactions.
 *     responses:
 *       200:
 *         description: Successful volume calculation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: number
 *                   example: 12345.67
 *                   description: The total transaction volume for the user.
 *                 message:
 *                   type: string
 *                   example: "Data fetch successful!"
 *       400:
 *         description: Bad Request - Missing or invalid wallet or token mint
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
 *                   example: "Invalid wallet" or "Invalid token mint"
 *       500:
 *         description: Internal Server Error - Failed to fetch or process data
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
 *         description: Method Not Allowed - Invalid HTTP method
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
      const wallet = req.query.wallet;
      const tokenMint = req.query.tokenMint;

      if (!wallet)
        return res
          .status(400)
          .json({ success: false, message: "Invalid wallet" });

      if (!SPL_TOKENS.some((t) => t.tokenMint === tokenMint))
        return res
          .status(400)
          .json({ success: false, message: "Invalid token mint" });

      await connectDatabase();

      const user = await User.findOne({ wallet });
      if (!user)
        return res.json({ success: true, data: 0, message: "No data found" });

      let totalVolume = 0;

      for (const [_, value] of Object.entries(GameType)) {
        const game = value;
        const model = gameModelMap[game as keyof typeof gameModelMap];

        const res = await model.aggregate([
          {
            $match: {
              wallet,
              tokenMint,
            },
          },
          {
            $group: {
              _id: null,
              amount: { $sum: "$amount" },
            },
          },
        ]);

        if (res.length > 0) {
          totalVolume += res[0].amount;
        }
      }

      return res.json({
        success: true,
        data: totalVolume,
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

import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { Option, User } from "../../../../models/games";

/**
 * @swagger
 * /api/games/options/getActiveBet:
 *   get:
 *     summary: Get active bets for a user
 *     description: Fetches all active (pending) bets for a user based on their wallet or email.
 *     tags:
 *       - Games
 *     parameters:
 *       - in: query
 *         name: wallet
 *         schema:
 *           type: string
 *         description: The user's wallet address.
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: The user's email address.
 *     responses:
 *       200:
 *         description: Data fetch successful.
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
 *                 message:
 *                   type: string
 *       400:
 *         description: User does not exist.
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
 */

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      await connectDatabase();

      // const { searchParams } = req.nextUrl;
      // const wallet = searchParams.get("wallet");

      const wallet = req.query.wallet;
      const email = req.query.email;

      let user = null;
      if (wallet) {
        user = await User.findOne({
          wallet: wallet,
        });
      } else if (email) {
        user = await User.findOne({
          email: email,
        });
      }

      if (!user)
        return res
          .status(400)
          .json({ success: false, message: "User does not exist!" });

      const account = user._id;

      let bets = await Option.find({
        account,
        result: "Pending",
      });

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

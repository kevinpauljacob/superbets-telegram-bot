import { Mines, User } from "@/models/games";
import connectDatabase from "@/utils/database";
import { NextApiRequest, NextApiResponse } from "next";

/**
 * @swagger
 * /api/games/mines/pendingGame:
 *   get:
 *     summary: Check if there is a pending mines game
 *     description: Checks if the user has a pending mines game by providing their wallet or email.
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
 *         description: Pending game status retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 pendingGame:
 *                   type: object
 *                   description: The pending game details if any.
 *                 result:
 *                   type: boolean
 *                   description: Indicates if there is a pending game.
 *       400:
 *         description: User does not exist, missing parameters, or other client errors.
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
      const wallet = req.query.wallet;
      const email = req.query.email;

      if (!wallet && !email)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      await connectDatabase();

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

      const pendingGame = await Mines.findOne({
        account,
        result: "Pending",
      });
      const result = pendingGame !== null ? true : false;

      return res.json({
        success: true,
        pendingGame,
        result,
      });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  } else {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }
}

export default handler;

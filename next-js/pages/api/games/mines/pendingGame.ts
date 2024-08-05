import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { Mines, User } from "@/models/games";
import { maintainance } from "@/context/config";

/**
 * @swagger
 * /api/games/mines/pendingGame:
 *   post:
 *     summary: Check if there is a pending Mines game
 *     description: Checks if the user has a pending Mines game by providing their wallet or email.
 *     tags:
 *       - Games
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               wallet:
 *                 type: string
 *                 description: The user's wallet address.
 *               email:
 *                 type: string
 *                 description: The user's email address.
 *             required:
 *               - wallet
 *               - email
 *     responses:
 *       201:
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

const secret = process.env.NEXTAUTH_SECRET;

export const config = {
  maxDuration: 60,
};

type InputType = {
  wallet: string;
  email: string;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, email }: InputType = req.body;

      if (maintainance)
        return res.status(400).json({
          success: false,
          message: "Under maintenance",
        });

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

      return res.status(201).json({
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

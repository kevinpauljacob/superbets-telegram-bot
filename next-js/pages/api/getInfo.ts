import connectDatabase from "@/utils/database";
import { User } from "@/context/transactions";
import { User as user } from "@/models/games";
import { NextApiRequest, NextApiResponse } from "next";

/**
 * @swagger
 * tags:
 *  name: User
 *  description: User related operations
 */

/**
 * @swagger
 * /getInfo:
 *   get:
 *     summary: User operations
 *     description: Perform various user-related operations based on the provided option
 *     tags:
 *      - User
 *     parameters:
 *       - in: query
 *         name: option
 *         required: true
 *         schema:
 *           type: number
 *           enum: [1, 2, 3, 4]
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                 users:
 *                   type: array
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *       405:
 *         description: Method not allowed
 *       500:
 *         description: Internal server error
 */

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const { option, email } = req.query;

      if (!option)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      await connectDatabase();

      switch (parseInt(option as string, 10)) {
        // 1 - get User details
        case 1: {
          if (!email)
            return res
              .status(400)
              .json({ success: false, message: "Missing parameters" });

          let userInfo = await user.findOne({
            email: email as string,
          });

          if (!userInfo)
            return res.json({
              success: true,
              user: null,
              message: "User not found",
            });

          return res.json({
            success: true,
            user: userInfo,
            message: "User found",
          });
        }
        // 2 - get leaderboard
        case 2: {
          let usersInfo: User[] | null = await user.find().sort({ points: -1 });

          if (!usersInfo)
            return res.status(400).json({
              success: false,
              message: "Unable to fetch data.",
            });

          return res.json({ success: true, users: usersInfo });
        }
        // 3 - global info
        case 3: {
          let globalInfo = await user.aggregate([
            {
              $group: {
                _id: null,
                totalVolume: { $sum: "$solAmount" },
                users: { $sum: 1 },
                stakedTotal: { $sum: "$stakedAmount" },
              },
            },
          ]);

          if (!globalInfo)
            return res.status(400).json({
              success: false,
              message: "Unable to fetch data.",
            });

          return res.json({
            success: true,
            data: globalInfo[0],
          });
        }
        // 4 - get leaderboard with specific tokenMint
        case 4: {
          let usersInfo = await user.aggregate([
            { $unwind: "$deposit" },
            { $match: { "deposit.tokenMint": "SUPER" } },
            { $sort: { "deposit.amount": -1 } },
          ]);

          if (!usersInfo || usersInfo.length === 0) {
            return res.status(400).json({
              success: false,
              message: "Unable to fetch data.",
            });
          }

          return res.json({ success: true, users: usersInfo });
        }
        default:
          return res
            .status(400)
            .json({ success: false, message: "Invalid option" });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  } else {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }
}

export default handler;
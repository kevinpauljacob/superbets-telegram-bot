import connectDatabase from "@/utils/database";
import { User } from "@/models/games";
import { NextApiRequest, NextApiResponse } from "next";
import authenticateUser from "@/utils/authenticate";

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
  try {
    let query = {};

    if (req.method === "GET") {
      query = req.query;
    } else if (req.method === "POST") {
      query = req.body;
    } else {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed" });
    }

    const { option, account } = query as {
      option: string;
      account: string;
    };

    if (!option)
      return res
        .status(400)
        .json({ success: false, message: "Missing parameters" });

    await connectDatabase();

    switch (parseInt(option)) {
      // 1 - get User details

      //TODO: Change to POST method and add authentication
      case 1: {
        if (req.method !== "POST") {
          return res
            .status(405)
            .json({ success: false, message: "Method not allowed" });
        }

        if (!account)
          return res
            .status(400)
            .json({ success: false, message: "Missing parameters" });

        await authenticateUser(req, res);

        let user = await User.findById(account, { iv: 0, privateKey: 0 });

        if (!user)
          return res.json({
            success: false,
            user: null,
          });

        return res.json({
          success: true,
          user,
        });
      }

      // 2 - get leaderboard with specific tokenMint
      case 2: {
        if (req.method !== "GET") {
          return res
            .status(405)
            .json({ success: false, message: "Method not allowed" });
        }

        let usersInfo = await User.aggregate([
          { $unwind: "$deposit" },
          { $match: { "deposit.tokenMint": "SUPER" } },
          { $sort: { "deposit.amount": -1 } },
          {
            $project: {
              _id: 0,
              name: 1,
              image: 1,
              amount: "$deposit.amount",
            },
          },
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
}

export default handler;

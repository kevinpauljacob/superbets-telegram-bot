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
 *           enum: [2]
 *       - in: query
 *         name: account
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
 *   post:
 *     summary: Get user details
 *     description: Retrieve user details based on the provided account ID
 *     tags:
 *      - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               option:
 *                 type: number
 *                 enum: [1]
 *               account:
 *                 type: string
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
 *       400:
 *         description: Bad request
 *       405:
 *         description: Method not allowed
 *       500:
 *         description: Internal server error
 */

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const query = req.method === "GET" ? req.query : req.body;
    const { option, account } = query as { option: string; account: string };

    if (!option) {
      return res
        .status(400)
        .json({ success: false, message: "Missing parameters" });
    }

    await connectDatabase();

    switch (parseInt(option)) {
      case 1:
        return handleGetUserDetails(req, res, account);
      case 2:
        return handleGetLeaderboard(req, res);
      default:
        return res
          .status(400)
          .json({ success: false, message: "Invalid option" });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function handleGetUserDetails(
  req: NextApiRequest,
  res: NextApiResponse,
  account: string,
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  if (!account) {
    return res
      .status(400)
      .json({ success: false, message: "Missing parameters" });
  }

  await authenticateUser(req, res);

  const user = await User.findById(account, { iv: 0, privateKey: 0 });

  if (!user) {
    return res.status(400).json({ success: false, user: null });
  }

  return res.json({ success: true, user });
}

async function handleGetLeaderboard(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  const usersInfo = await User.aggregate([
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

  if (!usersInfo) {
    return res
      .status(400)
      .json({ success: false, message: "Unable to fetch data." });
  }

  return res.json({ success: true, users: usersInfo });
}

export default handler;

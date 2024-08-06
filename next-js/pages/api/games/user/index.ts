import { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";
import User from "../../../../models/games/gameUser";
import connectDatabase from "../../../../utils/database";
import authenticateUser from "../../../../utils/authenticate";

/**
 * @swagger
 * tags:
 *  name: Games/User
 *  description: Game user management
 */
/**
 * @swagger
 * /api/games/user:
 *   post:
 *     summary: Create or update a game user
 *     description: This endpoint creates a new user or updates an existing user in the game database.
 *     tags:
 *       - Games/User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - wallet
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               name:
 *                 type: string
 *                 example: John Doe
 *               image:
 *                 type: string
 *                 example: https://example.com/image.jpg
 *               wallet:
 *                 type: string
 *                 example: ABC1234XYZ5678
 *     responses:
 *       201:
 *         description: User created or updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 60d0fe4f5311236168a109ca
 *                     wallet:
 *                       type: string
 *                       example: ABC1234XYZ5678
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     image:
 *                       type: string
 *                       example: https://example.com/image.jpg
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     isWeb2User:
 *                       type: boolean
 *                       example: true
 *                     deposit:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           amount:
 *                             type: number
 *                             example: 100.0
 *                           tokenMint:
 *                             type: string
 *                             example: SUPER
 *                      reached500:
 *                        type: boolean
 *                 message:
 *                   type: string
 *                   example: User created successfully!
 *       400:
 *         description: Bad request.
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
 *                   example: Missing parameters
 *       405:
 *         description: Method not allowed.
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
 *                   example: Method not allowed
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }
  try {
    const { email, name, image, wallet } = req.body;

    await authenticateUser(req, res);

    await connectDatabase();

    let user: any = null;

    if (!email && !wallet)
      return res
        .status(400)
        .json({ success: false, message: "Missing parameters" });

    const defaultDeposit = {
      amount: 100.0,
      tokenMint: "SUPER",
    };

    if (email && wallet) {
      user = await User.findOneAndUpdate(
        {
          $or: [{ email }, { wallet }],
        },
        {
          $set: {
            email,
            name,
            image,
            wallet,
          },
        },
        {
          new: true,
          upsert: true,
        },
      );
    } else {
      if (email) {
        user = await User.findOneAndUpdate(
          {
            email,
          },
          {
            $setOnInsert: {
              email,
              name,
              image,
              isWeb2User: true,
              deposit: [defaultDeposit],
            },
          },
          {
            new: true,
            upsert: true,
          },
        );
      } else if (wallet) {
        user = await User.findOneAndUpdate(
          {
            wallet,
          },
          {
            $setOnInsert: {
              wallet,
              isWeb2User: true,
              deposit: [defaultDeposit],
            },
          },
          {
            new: true,
            upsert: true,
          },
        );
      } else
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });
    }

    // Check if any deposit meets the criteria
    const reached500 = user.deposit.some(
      (d: { tokenMint: string; amount: number }) =>
        d.tokenMint === "SUPER" && d.amount >= 500,
    );

    if (reached500) {
      user = await User.findByIdAndUpdate(
        user._id,
        { $set: { reached500: true } },
        { new: true },
      );
    }

    return res.status(201).json({
      success: true,
      user: {
        id: user?._id ?? null,
        wallet: user?.wallet ?? null,
        email: user?.email ?? null,
        image: user?.image ?? null,
        name: user?.name ?? null,
        isWeb2User: user?.isWeb2User ?? false,
        deposit: user?.deposit ?? [],
        reached500: user?.reached500 ?? false,
      },
      message: "User created successfully!",
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

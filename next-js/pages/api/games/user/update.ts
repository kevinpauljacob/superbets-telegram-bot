import { maintainance } from "@/context/config";
import { User } from "@/models/games";
import connectDatabase from "@/utils/database";
import { NextApiRequest, NextApiResponse } from "next";

/**
 * @swagger
 * /games/user/update:
 *   post:
 *     summary: Update name for a user
 *     description: This endpoint allows to update the name of a user.
 *     tags:
 *      - Games/User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email of the user.
 *               name:
 *                 type: string
 *                 description: The new username.
 *     responses:
 *       201:
 *         description: Username updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       405:
 *         description: Method not allowed
 *       500:
 *         description: Internal server error
 *     security:
 *       - API_KEY: []
 */

export const config = {
  maxDuration: 60,
};

type InputType = {
  email: string;
  name: string;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { email, name }: InputType = req.body;

      if (maintainance)
        return res.status(400).json({
          success: false,
          message: "Under maintenance",
        });

      if (!email || !name)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      if (typeof name !== "string")
        return res
          .status(400)
          .json({ success: false, message: "Invalid parameters" });

      await connectDatabase();

      let user = null;

      user = await User.findOne({
        email: email,
      });

      if (!user)
        return res
          .status(400)
          .json({ success: false, message: "User does not exist!" });

      const account = user._id;

      const userUpdate = await User.findOneAndUpdate(
        {
          _id: account,
        },
        {
          $set: {
            name: name,
          },
        },
        {
          new: true,
        },
      );

      if (!userUpdate) {
        throw new Error("Username update failed!");
      }

      return res.status(201).json({
        success: true,
        message: "Username updated successfully!",
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

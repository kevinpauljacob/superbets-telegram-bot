import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";
import { Campaign, User } from "@/models/referral";
import { getToken } from "next-auth/jwt";

/**
 * @swagger
 * /api/referral/{wallet}:
 *   get:
 *     summary: Get user and referred users by wallet
 *     description: Fetch user data along with referred users based on the wallet address
 *     tags:
 *      - Referral
 *     parameters:
 *       - in: query
 *         name: wallet
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet address of the user
 *     responses:
 *       200:
 *         description: Data fetch successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   type: object
 *                 referredUsers:
 *                   type: array
 *                   items:
 *                     type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       405:
 *         description: Method not allowed
 *       500:
 *         description: Internal server error
 */

const secret = process.env.NEXTAUTH_SECRET;

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET")
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed!" });

    const { wallet } = req.query;

    if (!wallet)
      return res
        .status(400)
        .json({ success: false, message: "Wallet is required!" });

    await connectDatabase();

    let user = await User.findOne({ wallet }).populate("campaigns");

    if (!user) {
      const defaultCampaign = "Default Campaign";
      const campaign = await Campaign.findOneAndUpdate(
        {
          wallet,
          campaignName: defaultCampaign,
        },
        {
          $setOnInsert: {
            referralCode: uuidv4().slice(0, 8),
          },
        },
        {
          upsert: true,
          new: true,
        },
      );

      await User.findOneAndUpdate(
        {
          wallet,
        },
        {
          $addToSet: { campaigns: campaign._id },
        },
        {
          upsert: true,
        },
      );

      user = await User.findOne({ wallet }).populate("campaigns");
    }

    const campaignIds = user?.campaigns.map((c: any) => c._id) || [];

    const referredUsers = await User.find({
      referredByChain: { $in: campaignIds },
    }).lean();

    return res.json({
      success: true,
      user,
      referredUsers,
      message: `Data fetch successful!`,
    });
  } catch (e: any) {
    console.log(e);
    return res.status(500).json({ success: false, message: e.message });
  }
}

export default handler;

import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";
import { Campaign, User } from "@/models/referral";
import { getToken } from "next-auth/jwt";

/**
 * @swagger
 * /api/referral/web2User:
 *   get:
 *     summary: Get or create user and their campaigns by email
 *     description: Fetch user and their campaigns by email. If the user does not exist, create a new user and a default campaign.
 *     tags:
 *      - Referral
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Email address of the user
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
 *                   properties:
 *                     email:
 *                       type: string
 *                     campaigns:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           campaignName:
 *                             type: string
 *                           referralCode:
 *                             type: string
 *                 referredUsers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *                       referredByChain:
 *                         type: array
 *                         items:
 *                           type: string
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
    if (req.method !== "GET") {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed!" });
    }

    const { email } = req.query;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required!" });
    }

    await connectDatabase();

    let user = await User.findOne({ email }).populate("campaigns");

    if (!user) {
      const defaultCampaign = "Default Campaign";
      const campaign = await Campaign.findOneAndUpdate(
        {
          email,
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
          email,
        },
        {
          $addToSet: { campaigns: campaign._id },
        },
        {
          upsert: true,
        },
      );

      user = await User.findOne({ email }).populate("campaigns");
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
    console.error(e);
    return res.status(500).json({ success: false, message: e.message });
  }
}

export default handler;
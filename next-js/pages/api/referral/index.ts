import { NextApiRequest, NextApiResponse } from "next";
import connectDatabase from "@/utils/database";
import { Campaign, User } from "@/models/referral/index";
import { v4 as uuidv4 } from "uuid";

/**
 * @swagger
 * tags:
 *    name: Referral
 *    description: Referral related operations
 */

/**
 * @swagger
 * /api/referral:
 *   post:
 *     summary: Create or update a user and default campaign
 *     description: Creates a new user with the provided account, email, or wallet, and a default campaign if the user does not exist. If the user already exists, it checks for a default campaign and creates it if not present. The response includes user details and referred users.
 *     tags:
 *       - Referral
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - account
 *             properties:
 *               account:
 *                 type: string
 *                 example: "user-account-id"
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               wallet:
 *                 type: string
 *                 example: "user-wallet-address"
 *     responses:
 *       200:
 *         description: Success response with user and referred users information.
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
 *                     _id:
 *                       type: string
 *                     account:
 *                       type: string
 *                     email:
 *                       type: string
 *                     wallet:
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
 *                       _id:
 *                         type: string
 *                       email:
 *                         type: string
 *                       account:
 *                         type: string
 *                       campaigns:
 *                         type: array
 *                         items:
 *                           type: string
 *                 message:
 *                   type: string
 *                   example: "Data fetch successful!"
 *       400:
 *         description: Bad request response when account, email, or wallet is not provided.
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
 *                   example: "account or email or wallet is required"
 *       405:
 *         description: Method not allowed response when using a method other than POST.
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
 *                   example: "Method not allowed!"
 *       500:
 *         description: Internal server error response.
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
 *                   example: "Internal server error"
 */

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed!" });
    }

    const { account, email, wallet } = req.body;

    if (!account || (!email && !wallet)) {
      return res.status(400).json({
        success: false,
        message: "account or email or wallet is required",
      });
    }

    await connectDatabase();

    let user = await User.findOne({ account }).populate("campaigns");

    if (!user) {
      const defaultCampaign = "Default Campaign";
      const campaign = await Campaign.findOneAndUpdate(
        {
          account,
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
          account,
        },
        {
          $addToSet: { campaigns: campaign._id },
        },
        {
          upsert: true,
        },
      );

      user = await User.findOne({ account }).populate("campaigns");
    }

    const campaignIds = user?.campaigns.map((c: any) => c._id) || [];

    const referredUsers = await User.find({
      referredByChain: { $in: campaignIds },
    })
      .populate({
        path: "account",
        model: "GameUser",
        select: "email wallet name image",
      })
      .lean();

    return res.status(200).json({
      success: true,
      user,
      referredUsers,
      message: `Data fetch successful!`,
    });
  } catch (error: any) {
    console.error("Error in /api/referral:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export default handler;

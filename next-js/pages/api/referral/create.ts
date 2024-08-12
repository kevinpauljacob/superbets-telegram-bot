import connectDatabase from "../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { User, Campaign } from "@/models/referral";

/**
 * @swagger
 * /api/referral:
 *   post:
 *     summary: Create a referral campaign
 *     description: Creates a new referral campaign and associates it with a user.
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
 *               - referralCode
 *               - campaignName
 *             properties:
 *               account:
 *                 type: string
 *                 example: "user-account-id"
 *               referralCode:
 *                 type: string
 *                 example: "ABC12345"
 *               campaignName:
 *                 type: string
 *                 example: "Summer Campaign"
 *     responses:
 *       200:
 *         description: Campaign created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Campaign created successfully!"
 *       400:
 *         description: Bad request response, such as when required fields are missing or duplicate data is detected.
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
 *                   example: "Missing parameters!"
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
 *                   example: "An error occurred while processing your request."
 */

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed!" });
    }

    const { account, referralCode, campaignName } = req.body;

    if (!account || !referralCode || !campaignName) {
      return res
        .status(400)
        .json({ success: false, message: "Missing parameters!" });
    }

    if (!/^[a-zA-Z0-9]*$/.test(referralCode)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid referral code!" });
    }

    await connectDatabase();

    // Check for existing campaign with the same referral code
    const existingCampaign = await Campaign.findOne({ referralCode });
    if (existingCampaign) {
      return res.status(400).json({
        success: false,
        message:
          "This referral code is already in use. Please choose a different one.",
      });
    }

    // Check for existing campaign with the same name for this user
    const existingUserCampaign = await Campaign.findOne({
      account,
      campaignName,
    });
    if (existingUserCampaign) {
      return res.status(400).json({
        success: false,
        message:
          "You already have a campaign with this name. Please choose a different name.",
      });
    }

    // Create new campaign
    const campaign = new Campaign({
      account,
      campaignName,
      referralCode,
    });
    await campaign.save();

    await User.findOneAndUpdate(
      { account },
      { $addToSet: { campaigns: campaign._id } },
      { upsert: true },
    );

    return res.json({
      success: true,
      message: `Campaign created successfully!`,
    });
  } catch (e: any) {
    console.error(e);
    if (e.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate key error. Please check your input.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your request.",
    });
  }
}

export default handler;

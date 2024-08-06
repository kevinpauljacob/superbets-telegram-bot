import connectDatabase from "../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { User, Campaign } from "@/models/referral";

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
 *     summary: Create a referral campaign
 *     description: Creates a new referral campaign and associates it with a user
 *     tags:
 *      - Referral
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - referralCode
 *               - campaignName
 *             properties:
 *               email:
 *                 type: string
 *               referralCode:
 *                 type: string
 *               campaignName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Campaign created successfully
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
 */

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed!" });
    }

    const { email, referralCode, campaignName } = req.body;

    if (!email || !referralCode || !campaignName) {
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
      email,
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
      email,
      campaignName,
      referralCode,
    });
    await campaign.save();

    // Update existing user
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $addToSet: { campaigns: campaign._id } },
      { new: true },
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message:
          "User not found. Please ensure the user exists before creating a campaign.",
      });
    }

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

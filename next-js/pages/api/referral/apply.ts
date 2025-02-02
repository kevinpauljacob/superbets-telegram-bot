import connectDatabase from "../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { User, Campaign } from "@/models/referral";
import { v4 as uuidv4 } from "uuid";

const secret = process.env.NEXTAUTH_SECRET;

/**
 * @swagger
 * /referral/apply:
 *   post:
 *     summary: Apply a referral code
 *     description: Apply a referral code to a user. Once applied, the referral code cannot be changed.
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
 *             properties:
 *               account:
 *                 type: string
 *                 description: The user's account identifier
 *                 example: "user-account-id"
 *               referralCode:
 *                 type: string
 *                 description: The referral code to apply
 *                 example: "ABC12345"
 *     responses:
 *       200:
 *         description: Referral code applied successfully
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
 *                   example: "Referral code applied successfully!"
 *       400:
 *         description: Bad request, such as invalid parameters or referral code already applied
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
 *         description: Method not allowed response when using a method other than POST
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
 *         description: Internal server error response
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
 *     security:
 *       - API_KEY: []
 */

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST")
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed!" });

    const { account, referralCode } = req.body;

    if (!account || !referralCode)
      return res
        .status(400)
        .json({ success: false, message: "Missing parameters!" });

    if (!/^[a-zA-Z0-9]*$/.test(referralCode))
      return res
        .status(400)
        .json({ success: false, message: "Invalid referral code!" });

    await connectDatabase();

    const campaign = await Campaign.findOne({ referralCode });

    if (!campaign)
      return res
        .status(400)
        .json({ success: false, message: "Referral code not found!" });

    if (campaign.account.toString() === account)
      return res
        .status(400)
        .json({ success: false, message: "You can't refer yourself!" });

    const referrer = await User.findOne({
      account: campaign.account,
    });

    if (!referrer)
      return res
        .status(400)
        .json({ success: false, message: "Referrer not found!" });

    const referredByChain = [campaign._id, ...referrer.referredByChain].slice(
      0,
      5,
    );

    // Try to find an existing user
    let user = await User.findOne({ account });

    if (user) {
      // If user exists and already has a referral, prevent reapplying
      if (user.referredByChain && user.referredByChain.length > 0) {
        return res.status(400).json({
          success: false,
          message:
            "You have already applied a referral code and cannot change it.",
        });
      }

      // If user exists but doesn't have a referral, update their referral
      user = await User.findOneAndUpdate(
        { account },
        { $set: { referredByChain } },
        { new: true },
      );
    } else {
      // If user doesn't exist, create a new user with the referral
      user = await User.create({
        account,
        referredByChain,
      });
    }

    // Increment signup count for the campaign
    campaign.signupCount += 1;
    await campaign.save();

    // Create default campaign for the user if they don't have any
    if (user.campaigns.length === 0) {
      const defaultCampaign = "Default Campaign";
      const newCampaign = await Campaign.findOneAndUpdate(
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
        { account },
        { $addToSet: { campaigns: newCampaign._id } },
      );
    }

    return res.json({
      success: true,
      message: "Referral code applied successfully!",
    });
  } catch (e: any) {
    console.log(e);
    return res.status(500).json({ success: false, message: e.message });
  }
}

export default handler;

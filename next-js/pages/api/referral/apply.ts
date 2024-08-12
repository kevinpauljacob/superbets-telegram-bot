import connectDatabase from "../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { User, Campaign } from "@/models/referral";
import { v4 as uuidv4 } from "uuid";

const secret = process.env.NEXTAUTH_SECRET;

/**
 * @swagger
 * /api/referral/apply:
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
 *               referralCode:
 *                 type: string
 *                 description: The referral code to apply
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
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request (e.g., invalid parameters, referral code already applied)
 *       405:
 *         description: Method not allowed
 *       500:
 *         description: Internal server error
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

    const currentUser = await User.findOne({ account });
    if (!currentUser)
      return res
        .status(400)
        .json({ success: false, message: "User not found!" });

    if (currentUser.referredByChain.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "You have already applied a referral code and cannot change it.",
      });
    }

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

    const user = await User.findOneAndUpdate(
      { account, referredByChain: [] },
      {
        $set: {
          referredByChain,
        },
      },
      { upsert: true, new: true },
    ).catch((e) => {
      return res.status(400).json({
        success: false,
        message: "Applied referralCode cannot be changed!",
      });
    });

    campaign.signupCount += 1;
    await campaign.save();

    if (user.campaigns.length === 0) {
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

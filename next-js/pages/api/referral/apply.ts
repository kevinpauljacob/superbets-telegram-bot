import connectDatabase from "../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { User, Campaign } from "@/models/referral";
import { v4 as uuidv4 } from "uuid";
import { getToken } from "next-auth/jwt";

/**
 * @swagger
 * /api/referral/apply:
 *   post:
 *     summary: Apply a referral code
 *     description: Apply a referral code to a user and update the referrer's signup count
 *     tags:
 *      - Referral
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - referralCode
 *             properties:
 *               wallet:
 *                 type: string
 *               email:
 *                 type: string
 *               referralCode:
 *                 type: string
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
 *         description: Bad request
 *       405:
 *         description: Method not allowed
 *       500:
 *         description: Internal server error
 */

const secret = process.env.NEXTAUTH_SECRET;

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST")
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed!" });

    const { wallet, email, referralCode } = req.body;

    if ((!wallet && !email) || !referralCode)
      return res
        .status(400)
        .json({ success: false, message: "Missing parameters!" });

    //check if referralCode consists of only alphanumeric characters
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

    const isSelfReferral =
      (campaign.wallet && campaign.wallet === wallet) ||
      (campaign.email && campaign.email === email);

    if (isSelfReferral) {
      return res
        .status(400)
        .json({ success: false, message: "You can't refer yourself!" });
    }

    const referrer = await User.findOne({
      $or: [{ wallet: campaign.wallet }, { email: campaign.email }],
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
      {
        wallet,
        email,
        referredByChain: [],
      },
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
          wallet,
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
          wallet,
          email,
        },
        {
          $addToSet: { campaigns: campaign._id },
        },
      );
    }

    return res.json({
      success: true,
      message: `Referral code applied successfully!`,
    });
  } catch (e: any) {
    console.log(e);
    return res.status(500).json({ success: false, message: e.message });
  }
}

export default handler;

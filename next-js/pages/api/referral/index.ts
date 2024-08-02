import connectDatabase from "../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { User, Campaign } from "@/models/referral";
import { getToken } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET;

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST")
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed!" });

    const { wallet, email, referralCode, campaignName } = req.body;

    if ((!wallet && !email) || !referralCode || !campaignName)
      return res
        .status(400)
        .json({ success: false, message: "Missing parameters!" });

    //check if referralCode consists of only alphanumeric characters
    if (!/^[a-zA-Z0-9]*$/.test(referralCode))
      return res
        .status(400)
        .json({ success: false, message: "Invalid referral code!" });

    await connectDatabase();

    // const existingCampaign = await Campaign.findOne({ referralCode });
    // if (existingCampaign) {
    //   return res.status(400).json({
    //     success: false,
    //     message:
    //       "This referral code is already in use. Please choose a different one.",
    //   });
    // }

    const campaign = new Campaign({
      wallet,
      email,
      campaignName,
      referralCode,
    });
    await campaign.save();

    await User.findOneAndUpdate(
      {
        $or: [{ wallet }, { email }],
      },
      {
        $addToSet: { campaigns: campaign._id },
      },
      { upsert: true },
    );

    return res.json({
      success: true,
      message: `Campaign created successfully!`,
    });
  } catch (e: any) {
    console.log(e);
    return res.status(500).json({ success: false, message: e.message });
  }
}

export default handler;

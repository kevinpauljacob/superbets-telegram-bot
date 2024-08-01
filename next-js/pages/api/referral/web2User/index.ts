import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";
import { Campaign, User } from "@/models/referral";
import { getToken } from "next-auth/jwt";

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

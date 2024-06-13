import connectDatabase from "../../../../utils/database";
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

    const { wallet, referralCode } = req.body;

    const token = await getToken({ req, secret });

    if (!token || !token.sub || token.sub != wallet)
      return res.send({
        error: "User wallet not authenticated",
      });

    if (!wallet || !referralCode)
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

    if (campaign.wallet === wallet)
      return res
        .status(400)
        .json({ success: false, message: "You can't refer yourself!" });

    const referrer = await User.findOne({ wallet: campaign.wallet });

    if (!referrer)
      return res
        .status(400)
        .json({ success: false, message: "Referrer not found!" });

    const referredByChain = [campaign._id, ...referrer.referredByChain].slice(
      0,
      5,
    );

    await User.findOneAndUpdate(
      {
        wallet,
        referredByChain: [],
      },
      {
        $set: {
          referredByChain,
        },
      },
      { upsert: true },
    );

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

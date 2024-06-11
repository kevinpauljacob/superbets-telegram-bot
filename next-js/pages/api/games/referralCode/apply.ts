import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { Referral } from "@/models/games";
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

    const referrer = await Referral.findOne({ referralCode });

    if (!referrer)
      return res
        .status(400)
        .json({ success: false, message: "Referrer not found!" });

    if (referrer.wallet === wallet)
      return res
        .status(400)
        .json({ success: false, message: "You can't refer yourself!" });

    const referredByChain = [referrer._id, ...referrer.referredByChain].slice(
      0,
      5,
    );

    const referral = await Referral.findOneAndUpdate(
      {
        wallet,
        referredByChain: [],
      },
      {
        $set: {
          referredByChain,
        },
      },
      { upsert: true, new: true },
    );

    return res.json({
      success: true,
      data: referral,
      message: `Referral code applied successfully!`,
    });
  } catch (e: any) {
    console.log(e);
    return res.status(500).json({ success: false, message: e.message });
  }
}

export default handler;

import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { Referral } from "@/models/games";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const { wallet } = req.query;

      if (!wallet)
        return res
          .status(400)
          .json({ success: false, message: "Wallet is required!" });

      await connectDatabase();

      const referral = await Referral.findOne({ wallet });

      return res.json({
        success: true,
        data: referral,
        message: `Data fetch successful!`,
      });
    } else if (req.method === "POST") {
      const { wallet, referralCode } = req.body;

      if (!wallet || !referralCode)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters!" });

      //check if referralCode consists of only alphanumeric characters
      if (!/^[a-zA-Z0-9]*$/.test(referralCode))
        return res
          .status(400)
          .json({ success: false, message: "Invalid referral code!" });

      if (await Referral.findOne({ referralCode }))
        return res
          .status(400)
          .json({ success: false, message: "Referral code already exists!" });

      const referral = await Referral.findOneAndUpdate(
        {
          wallet,
        },
        {
          $set: {
            referralCode,
          },
        },
        { upsert: true },
      );

      await connectDatabase();

      return res.json({
        success: true,
        data: referral,
        message: `Referral code set successfully!`,
      });
    } else
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed!" });
  } catch (e: any) {
    console.log(e);
    return res.status(500).json({ success: false, message: e.message });
  }
}

export default handler;

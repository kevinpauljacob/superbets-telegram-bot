import connectDatabase from "../../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { ReferralUser } from "@/models/referral";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET")
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed!" });

    const { wallet } = req.query;

    if (!wallet)
      return res
        .status(400)
        .json({ success: false, message: "Wallet is required!" });

    await connectDatabase();

    const referral = await ReferralUser.findOne({ wallet }).populate(
      "campaigns",
    );

    return res.json({
      success: true,
      data: referral,
      message: `Data fetch successful!`,
    });
  } catch (e: any) {
    console.log(e);
    return res.status(500).json({ success: false, message: e.message });
  }
}

export default handler;

import connectDatabase from "../../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { User } from "@/models/referral";

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

    const user = await User.findOne({ wallet }).populate("campaigns");
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
    console.log(e);
    return res.status(500).json({ success: false, message: e.message });
  }
}

export default handler;

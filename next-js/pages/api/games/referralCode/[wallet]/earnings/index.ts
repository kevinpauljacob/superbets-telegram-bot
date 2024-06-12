import { Referral } from "@/models/games";
import { NextApiRequest, NextApiResponse } from "next";
import connectDatabase from "../../../../../../utils/database";

export const config = {
  maxDuration: 60,
};

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

    const user = await Referral.findOne({ wallet });
    const referred = !user
      ? null
      : await Referral.find({
          referredByChain: { $in: [user._id] },
        }).lean();

    return res.json({
      success: true,
      user,
      data: referred,
      message: `Data fetch successful!`,
    });
  } catch (e: any) {
    console.log(e);
    return res.status(500).json({ success: false, message: e.message });
  }
}

export default handler;

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

    const referral = await Referral.findOne({ wallet });
    const referred = await Referral.find({
      referredByChain: { $in: [referral._id] },
    });

    return res.json({
      success: true,
      data: referred,
      message: `Data fetch successful!`,
    });
  } catch (e: any) {
    console.log(e);
    return res.status(500).json({ success: false, message: e.message });
  }
}

export default handler;

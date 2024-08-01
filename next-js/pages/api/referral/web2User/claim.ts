import { NextApiRequest, NextApiResponse } from "next";
import User from "@/models/games/gameUser";
import ReferralCampaign from "@/models/referral/referralCampaign";
import connectDatabase from "@/utils/database";
// import authenticateUser from "../../../../utils/authenticate";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    // await authenticateUser(req, res);
    await connectDatabase();

    const { email, wallet, campaignId } = req.body;

    if (!email && !wallet) {
      return res
        .status(400)
        .json({ success: false, message: "Email or wallet is required" });
    }

    if (!campaignId) {
      return res
        .status(400)
        .json({ success: false, message: "Campaign ID is required" });
    }

    // Find the user
    const user = await User.findOne({
      $or: [{ email }, { wallet }],
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Find the campaign
    const campaign = await ReferralCampaign.findById(campaignId);

    if (!campaign) {
      return res
        .status(404)
        .json({ success: false, message: "Campaign not found" });
    }

    // Get the unclaimed SUPER earnings
    const unclaimedSuperEarnings = campaign.unclaimedEarnings.get("SUPER") || 0;
    console.log("unclaimed ", unclaimedSuperEarnings);
    console.log("campaign", campaign);
    if (unclaimedSuperEarnings <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "No unclaimed SUPER earnings" });
    }

    // Update the user's deposit
    const superDepositIndex = user.deposit.findIndex(
      (d: any) => d.tokenMint === "SUPER",
    );
    if (superDepositIndex !== -1) {
      user.deposit[superDepositIndex].amount += unclaimedSuperEarnings;
    } else {
      user.deposit.push({
        amount: unclaimedSuperEarnings,
        tokenMint: "SUPER",
      });
    }

    // Reset the unclaimed earnings for SUPER in the campaign
    campaign.unclaimedEarnings.set("SUPER", 0);

    // Save the changes
    await user.save();
    await campaign.save();

    return res.status(200).json({
      success: true,
      message: "SUPER earnings claimed successfully",
      claimedAmount: unclaimedSuperEarnings,
      updatedDeposit: user.deposit,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

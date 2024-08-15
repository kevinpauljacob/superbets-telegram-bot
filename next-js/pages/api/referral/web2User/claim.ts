import { NextApiRequest, NextApiResponse } from "next";
import User from "@/models/games/gameUser";
import ReferralCampaign from "@/models/referral/referralCampaign";
import connectDatabase from "@/utils/database";

/**
 * @swagger
 * /referral/web2User/claim:
 *   post:
 *     summary: Claim SUPER earnings for a user from a referral campaign
 *     description: This endpoint allows a user to claim their unclaimed SUPER earnings from a referral campaign. The earnings are added to the user's deposit.
 *     tags:
 *      - Referral
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email of the user.
 *               campaignId:
 *                 type: string
 *                 description: The ID of the referral campaign.
 *     responses:
 *       200:
 *         description: SUPER earnings claimed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 claimedAmount:
 *                   type: number
 *                 updatedDeposit:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       amount:
 *                         type: number
 *                       tokenMint:
 *                         type: string
 *       400:
 *         description: Bad request
 *       404:
 *         description: User or campaign not found
 *       405:
 *         description: Method not allowed
 *       500:
 *         description: Internal server error
 *     security:
 *       - API_KEY: []
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed" });
    }

    const { account, campaignId } = req.body;

    if (!account) {
      return res
        .status(400)
        .json({ success: false, message: "Account is required" });
    }

    if (!campaignId) {
      return res
        .status(400)
        .json({ success: false, message: "Campaign ID is required" });
    }

    await connectDatabase();

    // Find the user
    const user = await User.findOne({
      _id: account,
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
    // console.log("unclaimed ", unclaimedSuperEarnings);
    // console.log("campaign", campaign);

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
      // Convert to string, then to number to avoid precision issues
      const currentAmount = Number(
        user.deposit[superDepositIndex].amount.toString(),
      );
      const newAmount = Number(
        (currentAmount + unclaimedSuperEarnings).toFixed(8),
      );
      user.deposit[superDepositIndex].amount = newAmount;
    } else {
      user.deposit.push({
        amount: Number(unclaimedSuperEarnings.toFixed(8)),
        tokenMint: "SUPER",
      });
    }

    // Reset the unclaimed earnings for SUPER in the campaign
    campaign.unclaimedEarnings.set("SUPER", 0);

    // Save the changes
    await user.save();
    await campaign.save();

    // Fetch the updated user to ensure we're returning the latest data
    const updatedUser = await User.findById(user._id);

    return res.status(200).json({
      success: true,
      message: "SUPER earnings claimed successfully",
      claimedAmount: unclaimedSuperEarnings,
      updatedDeposit: updatedUser.deposit,
    });
  } catch (e: any) {
    console.log(e);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

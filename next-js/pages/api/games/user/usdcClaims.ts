import { NextApiRequest, NextApiResponse } from "next";
import GameUser from "../../../../models/games/gameUser";
import connectDatabase from "../../../../utils/database";
import authenticateUser from "../../../../utils/authenticate";

/**
 * @swagger
 * /api/games/usdcClaims:
 *   get:
 *     summary: Get USDC claim information
 *     description: This endpoint retrieves information about USDC claims for the day.
 *     tags:
 *       - Games/USDCClaims
 *     responses:
 *       200:
 *         description: USDC claim information retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 claimedCount:
 *                   type: number
 *                   example: 3
 *                 spotsLeft:
 *                   type: number
 *                   example: 7
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internal server error
 *   post:
 *     summary: Claim USDC
 *     description: This endpoint allows a user to claim 1 USDC if eligible.
 *     tags:
 *       - Games/USDCClaims
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 60d0fe4f5311236168a109ca
 *     responses:
 *       200:
 *         description: USDC claimed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: USDC claimed successfully
 *       400:
 *         description: Bad request or claim attempt failed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Not eligible for USDC claim
 *       405:
 *         description: Method not allowed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Method not allowed
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */

async function getUSDCClaimInfo() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const claimedCount = await GameUser.countDocuments({
    dailyUSDCClaimed: true,
    lastUSDCClaimDate: { $gte: today },
  });

  const spotsLeft = 10 - claimedCount;

  return { claimedCount, spotsLeft };
}

async function claimUSDC(userId: string) {
  const user = await GameUser.findById(userId);

  if (
    !user ||
    !user.deposit.some((d: any) => d.amount >= 500 && d.tokenMint === "SUPER")
  ) {
    return { success: false, message: "Not eligible for USDC claim" };
  }

  const { claimedCount } = await getUSDCClaimInfo();

  if (claimedCount >= 10) {
    return {
      success: false,
      message: "All USDC spots for today have been claimed",
    };
  }

  user.dailyUSDCClaimed = true;
  user.lastUSDCClaimDate = new Date();

  const usdcDepositIndex = user.deposit.findIndex(
    (d: any) => d.tokenMint === "USDC",
  );
  if (usdcDepositIndex !== -1) {
    user.deposit[usdcDepositIndex].amount += 1;
  } else {
    user.deposit.push({ amount: 1, tokenMint: "USDC" });
  }

  await user.save();

  return { success: true, message: "USDC claimed successfully" };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    await connectDatabase();
    await authenticateUser(req, res);

    if (req.method === "GET") {
      const { claimedCount, spotsLeft } = await getUSDCClaimInfo();
      return res.status(200).json({
        success: true,
        claimedCount,
        spotsLeft,
      });
    } else if (req.method === "POST") {
      const { userId } = req.body;

      if (!userId) {
        return res
          .status(400)
          .json({ success: false, message: "Missing userId parameter" });
      }

      const result = await claimUSDC(userId);
      return res.status(result.success ? 200 : 400).json(result);
    } else {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed" });
    }
  } catch (error: any) {
    console.error("Error in USDC claims handler:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

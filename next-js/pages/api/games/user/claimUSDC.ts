import { NextApiRequest, NextApiResponse } from "next";
import GameUser from "@/models/games/gameUser";
import Deposit from "@/models/games/deposit";
import connectDatabase from "@/utils/database";
import authenticateUser from "@/utils/authenticate";
import { v4 as uuidv4 } from "uuid";
import { SPL_TOKENS } from "@/context/config";

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
  const claimedCount = await GameUser.countDocuments({
    isUSDCClaimed: true,
  });

  const spotsLeft = 10 - claimedCount;

  return { claimedCount, spotsLeft };
}

async function claimUSDC(userId: string) {
  const user = await GameUser.findById(userId);

  if (!user) {
    return { success: false, message: "User not found" };
  }

  if (user.isUSDCClaimed) {
    return { success: false, message: "USDC already claimed" };
  }

  const hasSuperDeposit = user.deposit.some(
    (d: any) => d.amount >= 500 && d.tokenMint === "SUPER",
  );

  if (!hasSuperDeposit) {
    return { success: false, message: "Not eligible for USDC claim" };
  }

  const claimedCount = await GameUser.countDocuments({
    isUSDCClaimed: true,
  });

  if (claimedCount >= 10) {
    return {
      success: false,
      message: "All USDC spots for today have been claimed",
    };
  }

  const claimCount = claimedCount + 1;
  const tokenMint = SPL_TOKENS.find((t) => t.tokenName === "USDC")?.tokenMint!;

  await GameUser.findOneAndUpdate(
    {
      _id: userId,
      "deposit.tokenMint": { $ne: tokenMint },
    },
    {
      $push: { deposit: { tokenMint, amount: 0 } },
    },
  );

  const updatedUser = await GameUser.findOneAndUpdate(
    {
      _id: userId,
      "deposit.tokenMint": tokenMint,
      $or: [{ isUSDCClaimed: { $exists: false } }, { isUSDCClaimed: false }],
    },
    {
      $inc: { "deposit.$.amount": 1.0 },
      $set: { isUSDCClaimed: true, claimCount },
    },
    {
      new: true,
    },
  );

  if (!updatedUser) {
    return { success: false, message: "Could not claim USDC" };
  }

  await Deposit.create({
    account: userId,
    type: true,
    amount: 1,
    tokenMint,
    status: "completed",
    comments: "USDC reward claimed",
    txnSignature: uuidv4(),
  });

  return { success: true, message: "USDC claimed successfully" };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    await connectDatabase();

    if (req.method === "GET") {
      const { claimedCount, spotsLeft } = await getUSDCClaimInfo();
      return res.status(200).json({
        success: true,
        claimedCount,
        spotsLeft,
      });
    } else if (req.method === "POST") {
      await authenticateUser(req, res);
      const { userId } = req.body;
      console.log("here");
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
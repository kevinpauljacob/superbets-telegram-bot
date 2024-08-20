import { NextApiRequest, NextApiResponse } from "next";
import GameUser from "@/models/games/gameUser";
import Deposit from "@/models/games/deposit";
import connectDatabase from "@/utils/database";
import authenticateUser from "@/utils/authenticate";
import { v4 as uuidv4 } from "uuid";
import { SPL_TOKENS } from "@/context/config";

/**
 * @swagger
 * /games/usdcClaims:
 *   get:
 *     summary: Get USDC claim information
 *     description: This endpoint retrieves information about USDC claims for the day.
 *     tags:
 *       - Games/USDCClaims
 *     parameters:
 *       - in: query
 *         name: slug
 *         schema:
 *           type: string
 *         description: The slug associated with your api key.
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
 *     security:
 *       - API_KEY: []
 */

async function getUSDCClaimInfo() {
  const claimedCount = await GameUser.countDocuments({
    isUSDCClaimed: true,
  });

  const spotsLeft = 10 - claimedCount;

  return { claimedCount, spotsLeft };
}

async function claimUSDC(userId: string) {
  try {
    console.log(`Starting USDC claim process for user: ${userId}`);

    const user = await GameUser.findById(userId);
    if (!user) {
      console.log("User not found");
      return { success: false, message: "User not found" };
    }

    if (user.isUSDCClaimed) {
      console.log("USDC already claimed");
      return { success: false, message: "USDC already claimed" };
    }

    const hasSuperDeposit = user.deposit.some(
      (d: any) => d.amount >= 500 && d.tokenMint === "SUPER",
    );

    if (!hasSuperDeposit) {
      console.log("Not eligible for USDC claim");
      return { success: false, message: "Not eligible for USDC claim" };
    }

    const claimedCount = await GameUser.countDocuments({
      isUSDCClaimed: true,
    });

    if (claimedCount >= 10) {
      console.log("All USDC spots for today have been claimed");
      return {
        success: false,
        message: "All USDC spots for today have been claimed",
      };
    }

    const claimCount = claimedCount + 1;
    const tokenMint = SPL_TOKENS.find((t) => t.tokenName === "USDC")?.tokenMint;

    if (!tokenMint) {
      console.log("USDC token mint not found");
      return { success: false, message: "USDC token mint not found" };
    }

    // Ensure the user has a deposit entry for the USDC token
    await GameUser.findOneAndUpdate(
      {
        _id: userId,
        "deposit.tokenMint": { $ne: tokenMint },
      },
      {
        $push: { deposit: { tokenMint, amount: 0 } },
      },
    );

    let updatedUser = await GameUser.findOneAndUpdate(
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
      console.log("No matching deposit found, creating new deposit entry.");

      updatedUser = await GameUser.findOneAndUpdate(
        { _id: userId },
        {
          $push: {
            deposit: {
              tokenMint,
              amount: 1.0, // Start with the claimed amount
            },
          },
          $set: { isUSDCClaimed: true, claimCount },
        },
        {
          new: true,
        },
      );

      if (!updatedUser) {
        console.log("Failed to create and update the new deposit entry.");
        return { success: false, message: "Could not claim USDC" };
      }
    }

    console.log("Update successful, creating deposit record");

    await Deposit.create({
      account: userId,
      type: true,
      amount: 1,
      tokenMint,
      status: "completed",
      comments: "USDC reward claimed",
      txnSignature: uuidv4(),
      wallet: user.wallet,
    });

    return { success: true, message: "USDC claimed successfully" };
  } catch (error) {
    console.error("Error in claimUSDC:", error);
    throw new Error("Internal Server Error");
  }
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

import { NextApiRequest, NextApiResponse } from "next";
import GameUser from "@/models/games/gameUser";
import Deposit from "@/models/games/deposit";
import connectDatabase from "@/utils/database";
import authenticateUser from "@/utils/authenticate";
import { v4 as uuidv4 } from "uuid";
import { SPL_TOKENS } from "@/context/config";
import {
  BlockhashWithExpiryBlockHeight,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import {
  timeWeightedAvgInterval,
  timeWeightedAvgLimit,
  userLimitMultiplier,
} from "@/context/config";
import User from "../../../../models/games/gameUser";

import { getToken } from "next-auth/jwt";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import TxnSignature from "../../../../models/txnSignature";
import { GameType } from "@/utils/provably-fair";
import { gameModelMap } from "@/models/games";
import {
  createWithdrawTxn,
  retryTxn,
  verifyTransaction,
} from "@/context/transactions";

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

async function gambleUSDC(userId: string) {
  try {
    console.log(`Starting USDC claim process for user: ${userId}`);

    let user = await User.findById(userId);

    const claimedCount = await GameUser.countDocuments({
      isUSDCClaimed: true,
    });

    const claimCount = claimedCount + 1;
    const tokenMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

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
      txnSignature: uuidv4().toString(),
      wallet: user.wallet,
    });

    return { success: true, message: "USDC claimed successfully" };
  } catch (error) {
    console.error("Error in claimUSDC:", error);
    throw new Error("Internal Server Error");
  }
}

const secret = process.env.NEXTAUTH_SECRET;

const connection = new Connection(process.env.BACKEND_RPC!, "confirmed");

const devWallet = Keypair.fromSecretKey(
  bs58.decode(process.env.CASINO_KEYPAIR!),
);

export const config = {
  maxDuration: 60,
};

type Totals = {
  depositTotal: number;
  withdrawalTotal: number;
};

async function withdrawUSDC(userId: string, wallet: string) {
  try {
    let user = await User.findById(userId);

    const account = user._id;

    const claimedCount = await GameUser.countDocuments({
      isUSDCClaimed: true,
    });

    const claimCount = claimedCount + 1;
    const tokenMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    const amount = 1;

    let { transaction, blockhashWithExpiryBlockHeight } =
      await createWithdrawTxn(
        new PublicKey(wallet),
        amount,
        tokenMint,
        devWallet.publicKey,
      );

    let result = await User.findOneAndUpdate(
      {
        _id: account,
        $or: [{ isUSDCClaimed: { $exists: false } }, { isUSDCClaimed: false }],
      },
      {
        $set: { isUSDCClaimed: true, claimCount },
      },
      {
        new: true,
      },
    );

    if (!result) {
      throw new Error(
        "Withdraw failed: Reward already claimed or user not found",
      );
    }

    const initialTotals: Totals = { depositTotal: 0, withdrawalTotal: 0 };

    const userAgg = await Deposit.aggregate([
      {
        $match: {
          tokenMint,
          createdAt: {
            $gte: new Date(Date.now() - timeWeightedAvgInterval),
          },
        },
      },
      {
        $group: {
          _id: "$account",
          depositTotal: {
            $sum: {
              $cond: [{ $eq: ["$type", true] }, "$amount", 0],
            },
          },
          withdrawalTotal: {
            $sum: {
              $cond: [{ $eq: ["$type", false] }, "$amount", 0],
            },
          },
        },
      },
    ]);

    const transferAgg = userAgg.reduce<Totals>((acc, current) => {
      acc.depositTotal += current.depositTotal;
      acc.withdrawalTotal += current.withdrawalTotal;
      return acc;
    }, initialTotals);

    const netTransfer =
      (transferAgg.withdrawalTotal ?? 0) -
      (transferAgg.depositTotal ?? 0) +
      amount;

    const tokenName = SPL_TOKENS.find((t) => t.tokenMint === tokenMint)
      ?.tokenName!;

    if (netTransfer > timeWeightedAvgLimit[tokenName]) {
      await Deposit.create({
        account,
        wallet,
        amount,
        type: false,
        comments: "global net transfer exceeded !",
        txnSignature: uuidv4().toString(),
        tokenMint,
        status: "review",
      });

      throw new Error("Withdrawal limit exceeded, added to queue for review");
    }

    const signer = Keypair.fromSecretKey(devWallet.secretKey);
    transaction.partialSign(signer);

    let txnSignature;

    try {
      txnSignature = await retryTxn(
        connection,
        transaction,
        blockhashWithExpiryBlockHeight,
      );
    } catch (e) {
      await Deposit.create({
        account,
        wallet,
        amount,
        type: false,
        comments: "Retry Transaction failed!",
        txnSignature: uuidv4().toString(),
        tokenMint,
        status: "failed",
      });
      throw new Error(`Withdraw failed! Please retry ... `);
    }
    await TxnSignature.create({ txnSignature });

    await Deposit.create({
      account,
      wallet,
      amount,
      type: false,
      tokenMint,
      txnSignature,
    });

    return {
      success: true,
      message: `${amount} ${tokenName ?? ""} successfully withdrawn!`,
    };
  } catch (e: any) {
    console.log(e);
    return { success: false, message: `Could not withdraw USDC. ${e.message}` };
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

      const { userId, option, wallet } = req.body;

      if (!userId || !option) {
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });
      }

      const user = await GameUser.findById(userId);
      if (!user) {
        console.log("User not found!");
        return res
          .status(400)
          .json({ success: false, message: "User not found!" });
      }

      if (user.isUSDCClaimed) {
        console.log("USDC already claimed!");
        return res
          .status(400)
          .json({ success: false, message: "USDC already claimed!" });
      }

      const hasSuperDeposit = user.deposit.some(
        (d: any) => d.amount >= 500 && d.tokenMint === "SUPER",
      );

      if (!hasSuperDeposit) {
        console.log("Not eligible for USDC claim!");
        return res
          .status(400)
          .json({ success: false, message: "Not eligible for USDC claim!" });
      }

      const claimedCount = await GameUser.countDocuments({
        isUSDCClaimed: true,
      });

      if (claimedCount >= 10) {
        console.log("All USDC spots for today have been claimed|");
        return res.status(400).json({
          success: false,
          message: "All USDC spots for today have been claimed!",
        });
      }

      let result;
      if (option === 1) result = await gambleUSDC(userId);
      else if (option === 2) {
        if (!wallet) {
          return res
            .status(400)
            .json({ success: false, message: "Missing parameters!" });
        }
        result = await withdrawUSDC(userId, wallet);
      } else result = { success: false, message: "Invalid option!" };
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

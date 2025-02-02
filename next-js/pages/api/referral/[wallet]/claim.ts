import {
  createClaimEarningsTxn,
  retryTxn,
  verifyTransaction,
} from "@/context/transactions";
import { Campaign } from "@/models/referral";
import TxnSignature from "@/models/txnSignature";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import {
  BlockhashWithExpiryBlockHeight,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import connectDatabase from "../../../../utils/database";
import Deposit from "@/models/games/deposit";
import mongoose from "mongoose";

/**
 * @swagger
 * /referral/{wallet}/claim:
 *   post:
 *     summary: Claim referral earnings
 *     description: Claim unclaimed referral earnings and create transaction
 *     tags:
 *      - Referral
 *     parameters:
 *       - in: query
 *         name: wallet
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet address of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionBase64
 *               - blockhashWithExpiryBlockHeight
 *             properties:
 *               transactionBase64:
 *                 type: string
 *                 description: Base64 encoded transaction
 *               blockhashWithExpiryBlockHeight:
 *                 type: object
 *                 properties:
 *                   blockhash:
 *                     type: string
 *                   lastValidBlockHeight:
 *                     type: number
 *     responses:
 *       200:
 *         description: Earnings claimed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 earnings:
 *                   type: object
 *                   additionalProperties:
 *                     type: number
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       405:
 *         description: Method not allowed
 *       500:
 *         description: Internal server error
 *     security:
 *       - API_KEY: []
 */

const secret = process.env.NEXTAUTH_SECRET;

const connection = new Connection(process.env.BACKEND_RPC!, "confirmed");

const devWalletKey = Keypair.fromSecretKey(
  bs58.decode(process.env.CASINO_KEYPAIR!),
);

export const config = {
  maxDuration: 60,
};

type InputType = {
  transactionBase64: string;
  blockhashWithExpiryBlockHeight: BlockhashWithExpiryBlockHeight;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST")
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed!" });

    const { wallet } = req.query;
    const { transactionBase64, blockhashWithExpiryBlockHeight }: InputType =
      req.body;

    if (!wallet || !transactionBase64 || !blockhashWithExpiryBlockHeight)
      return res
        .status(400)
        .json({ success: false, message: "Missing parameters!" });

    await connectDatabase();

    const session = await mongoose.startSession();
    session.startTransaction();

    let earnings: Record<string, number> = {};

    try {
      const aggregateEarnings = await Campaign.aggregate(
        [
          { $match: { wallet } },
          {
            $project: {
              unclaimedEarningsArr: {
                $objectToArray: "$unclaimedEarnings",
              },
            },
          },
          { $unwind: "$unclaimedEarningsArr" },
          {
            $group: {
              _id: "$unclaimedEarningsArr.k",
              totalUnclaimedEarnings: { $sum: "$unclaimedEarningsArr.v" },
            },
          },
        ],
        { session },
      );

      earnings = aggregateEarnings.reduce((acc, item) => {
        acc[item._id] = item.totalUnclaimedEarnings;
        return acc;
      }, {});

      await Campaign.updateMany(
        { wallet },
        { $set: { unclaimedEarnings: {} } },
        { session },
      );

      await session.commitTransaction();
      session.endSession();
    } catch (error: any) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({ success: false, message: error.message });
    }

    const { transaction: vTxn } = await createClaimEarningsTxn(
      new PublicKey(wallet),
      earnings,
    );

    const txn = Transaction.from(
      Buffer.from(transactionBase64 as string, "base64"),
    );

    if (!verifyTransaction(txn, vTxn))
      return res
        .status(400)
        .json({ success: false, message: "Transaction verfication failed" });

    txn.partialSign(devWalletKey);

    const txnSignature = await retryTxn(
      connection,
      txn,
      blockhashWithExpiryBlockHeight,
    );

    await TxnSignature.create({ txnSignature });

    await Deposit.create(
      Object.entries(earnings).map(([tokenMint, amount], index) => ({
        wallet,
        type: false,
        amount,
        tokenMint,
        comments: "Earnings claimed",
        txnSignature: txnSignature + `-${index}`,
      })),
    );

    return res.json({
      success: true,
      earnings,
      message: `Earnings claimed successfully!`,
    });
  } catch (e: any) {
    console.log(e);
    return res.status(500).json({ success: false, message: e.message });
  }
}

export default handler;

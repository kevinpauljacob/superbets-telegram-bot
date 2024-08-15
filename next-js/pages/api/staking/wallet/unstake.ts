import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import {
  createWithdrawTxn,
  verifyTransaction,
} from "../../../../context/transactions";
import { stakingTiers } from "@/context/config";
import connectDatabase from "../../../../utils/database";
import User from "../../../../models/staking/user";

import { getToken } from "next-auth/jwt";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import TxnSignature from "../../../../models/txnSignature";
import { NextApiRequest, NextApiResponse } from "next";
import { SPL_TOKENS } from "@/context/config";

/**
 * @swagger
 * /staking/wallet/unstake:
 *   post:
 *     summary: Unstake FOMO tokens
 *     description: Handles the unstaking of FOMO tokens from the user's wallet.
 *     tags:
 *       - Staking
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactionBase64:
 *                 type: string
 *                 description: The base64 encoded transaction.
 *               wallet:
 *                 type: string
 *                 description: The wallet address.
 *               amount:
 *                 type: number
 *                 description: The amount to unstake.
 *               tokenMint:
 *                 type: string
 *                 description: The mint address of the token.
 *               blockhashWithExpiryBlockHeight:
 *                 type: object
 *                 properties:
 *                   blockhash:
 *                     type: string
 *                     description: The blockhash for the transaction.
 *                   lastValidBlockHeight:
 *                     type: number
 *                     description: The last valid block height for the transaction.
 *     responses:
 *       200:
 *         description: Successfully unstaked FOMO tokens.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request parameters or transaction failed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       405:
 *         description: Method not allowed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */

const secret = process.env.NEXTAUTH_SECRET;

const connection = new Connection(process.env.BACKEND_RPC!);

const devWalletKey = Keypair.fromSecretKey(
  bs58.decode(process.env.STAKING_KEYPAIR!),
);

export const config = {
  maxDuration: 60,
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let {
        transactionBase64,
        wallet,
        amount,
        tokenMint,
        blockhashWithExpiryBlockHeight,
      } = req.body;

      await connectDatabase();

      const fomoToken = SPL_TOKENS.find(
        (token) => token.tokenName === "FOMO",
      )?.tokenMint!;

      if (
        !wallet ||
        !transactionBase64 ||
        !amount ||
        !blockhashWithExpiryBlockHeight ||
        !tokenMint ||
        tokenMint != fomoToken
      )
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      if (amount <= 0)
        return res
          .status(400)
          .json({ success: false, message: "Invalid withdraw amount !" });

      let user = await User.findOne({ wallet });

      if (!user)
        return res
          .status(400)
          .json({ success: false, message: "User does not exist !" });

      if (user.stakedAmount < amount)
        return res
          .status(400)
          .json({ success: false, message: "Insufficient balance !" });

      let { transaction: vTxn } = await createWithdrawTxn(
        new PublicKey(wallet),
        amount,
        tokenMint,
        devWalletKey.publicKey,
      );

      const txn = Transaction.from(
        Buffer.from(transactionBase64 as string, "base64"),
      );

      if (!verifyTransaction(txn, vTxn))
        return res
          .status(400)
          .json({ success: false, message: "Transaction verification failed" });
      console.log("Transaction verified");

      let tier = 0;
      let multiplier = 0.5;
      let checkAmt = user.stakedAmount - amount;

      Object.entries(stakingTiers).forEach(([key, value]) => {
        if (checkAmt >= value.limit) {
          tier = parseInt(key);
          multiplier = value.multiplier;
        }
      });

      const result = await User.findOneAndUpdate(
        {
          wallet,
          stakedAmount: { $gte: amount },
        },
        {
          $inc: { stakedAmount: -amount },
          $set: {
            tier,
            multiplier,
            points: 0,
          },
        },
        { new: true },
      );

      if (!result) {
        throw new Error("Unstake failed: insufficient funds or user not found");
      }

      txn.partialSign(devWalletKey);

      let txnSignature = "";
      try {
        txnSignature = await connection.sendRawTransaction(txn.serialize(), {
          skipPreflight: true,
        });

        const confirmationRes = await connection.confirmTransaction(
          {
            signature: txnSignature,
            ...blockhashWithExpiryBlockHeight,
          },
          "confirmed",
        );

        if (confirmationRes.value.err)
          throw new Error(confirmationRes.value.err.toString());
      } catch (error) {
        console.log(error);

        // await User.findOneAndUpdate(
        //   {
        //     wallet,
        //   },
        //   {
        //     $inc: { stakedAmount: amount },
        //     $set: {
        //       tier: user.tier,
        //       multiplier: user.multiplier,
        //       points: user.points,
        //     },
        //   },
        // );

        return res.status(400).json({
          success: false,
          message: "Transaction confirmation failed",
        });
      }

      await TxnSignature.create({ txnSignature });

      return res.json({
        success: true,
        message: `${amount} FOMO successfully unstaked!`,
      });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}

export default handler;

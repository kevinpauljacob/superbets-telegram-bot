import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  createDepositTxn,
  fomoToken,
  stakingTiers,
  verifyTransaction,
} from "../../../../context/transactions";
import connectDatabase from "../../../../utils/database";
import User from "../../../../models/staking/user";
import TxnSignature from "../../../../models/txnSignature";

import { getToken } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET;

const connection = new Connection(process.env.BACKEND_RPC!);

export const config = {
  maxDuration: 60,
};

async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
    return res.status(200).end();
  }

  if (req.method === "POST") {
    try {
      let { transactionBase64, wallet, amount, tokenMint, blockhash } =
        req.body;

      const token = await getToken({ req, secret });

      if (!token || !token.sub || token.sub != wallet)
        return res.status(400).json({
          success: false,
          message: "User wallet not authenticated",
        });

      await connectDatabase();

      if (
        !wallet ||
        !transactionBase64 ||
        !amount ||
        !blockhash ||
        !tokenMint ||
        tokenMint != fomoToken
      )
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      if (amount <= 0)
        return res
          .status(400)
          .json({ success: false, message: "Invalid deposit amount !" });

      let { transaction: vTxn } = await createDepositTxn(
        new PublicKey(wallet),
        amount,
        tokenMint,
      );

      const txn = Transaction.from(
        Buffer.from(transactionBase64 as string, "base64"),
      );

      if (!verifyTransaction(txn, vTxn))
        return res
          .status(400)
          .json({ success: false, message: "Transaction verification failed" });
      console.log("Transaction verified");

      const txnSignature = await connection.sendRawTransaction(txn.serialize());

      const confirmationRes = await connection.confirmTransaction(
        {
          signature: txnSignature,
          ...blockhash,
        },
        "confirmed",
      );

      if (confirmationRes.value.err)
        return res.status(400).json({
          success: false,
          message: "Transaction confirmation failed",
        });

      await TxnSignature.create({ txnSignature });

      let user = await User.findOne({ wallet });
      let tier = 0;
      let multiplier = 0.5;
      let checkAmt = user ? user.stakedAmount + amount : amount;

      Object.entries(stakingTiers).forEach(([key, value]) => {
        if (checkAmt >= value.limit) {
          tier = parseInt(key);
          multiplier = value.multiplier;
        }
      });

      await User.findOneAndUpdate(
        {
          wallet,
        },
        {
          $inc: { stakedAmount: amount },
          $set: { tier, multiplier },
          $setOnInsert: {
            solAmount: 0,
            keys: 0,
            points: 0,
          },
        },
        { new: true, upsert: true },
      );

      return res.json({
        success: true,
        message: `${amount} FOMO successfully staked!`,
      });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}

export default handler;

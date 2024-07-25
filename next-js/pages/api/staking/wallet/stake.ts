import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import {
  createDepositTxn,
  verifyTransaction,
} from "../../../../context/transactions";
import { stakingTiers } from "@/context/config";
import connectDatabase from "../../../../utils/database";
import User from "../../../../models/staking/user";
import TxnSignature from "../../../../models/txnSignature";

import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import { SPL_TOKENS } from "@/context/config";

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
          .json({ success: false, message: "Invalid deposit amount !" });

      let { transaction: vTxn } = await createDepositTxn(
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

      const txnSignature = await connection.sendRawTransaction(
        txn.serialize(),
        { skipPreflight: true },
      );

      const confirmationRes = await connection.confirmTransaction(
        {
          signature: txnSignature,
          ...blockhashWithExpiryBlockHeight,
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

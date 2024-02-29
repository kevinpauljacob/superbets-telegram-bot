import {
  Connection,
  PublicKey,
  Transaction,
  sendAndConfirmRawTransaction,
} from "@solana/web3.js";
import {
  createDepositTxn,
  tiers,
  verifyFrontendTransaction,
} from "../../../context/transactions";
import connectDatabase from "../../../utils/database";
import User from "../../../models/user";
import TxnSignature from "../../../models/txnSignature";

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
      let { transactionBase64, wallet, amount, tokenMint } = req.body;

      // return res.send("Under Maintainance");

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
        !tokenMint ||
        tokenMint != "Cx9oLynYgC3RrgXzin7U417hNY9D6YB1eMGw4ZMbWJgw"
      )
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      if (amount <= 0)
        return res
          .status(400)
          .json({ success: false, message: "Invalid deposit amount !" });

      let vTxn = await createDepositTxn(
        new PublicKey(wallet),
        amount,
        tokenMint,
      );

      const txn = Transaction.from(
        Buffer.from(transactionBase64 as string, "base64"),
      );

      if (!verifyFrontendTransaction(txn, vTxn))
        return res
          .status(400)
          .json({ success: false, message: "Transaction verification failed" });

      let txnSignature = await sendAndConfirmRawTransaction(
        connection,
        txn.serialize(),
        {
          commitment: "confirmed",
          skipPreflight: true,
        },
      );

      await TxnSignature.create({ txnSignature });

      let user = await User.findOne({ wallet });
      let tier = 0;
      let multiplier = 0.5;
      let checkAmt = user ? user.stakedAmount + amount : amount;

      Object.entries(tiers).some(([key, value], index) => {
        if (amount >= 600000) {
          tier = 7;
          multiplier = 2;
          return true;
        } else if (amount < value.limit) {
          tier = index;
          multiplier = value.multiplier;
          return true;
        }
      });

      if (!user)
        await User.create({
          wallet,
          stakedAmount: amount,
          tier: tier,
          multiplier: multiplier,
        });
      else
        await User.findOneAndUpdate(
          {
            wallet,
          },
          {
            $inc: { stakedAmount: amount },
            tier: tier,
            multiplier: multiplier,
          },
          { new: true },
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

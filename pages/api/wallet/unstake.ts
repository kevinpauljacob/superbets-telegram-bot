import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmRawTransaction,
} from "@solana/web3.js";
import {
  createWithdrawTxn,
  tiers,
  verifyFrontendTransaction,
} from "../../../context/transactions";
import connectDatabase from "../../../utils/database";
import User from "../../../models/user";

import { getToken } from "next-auth/jwt";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import TxnSignature from "../../../models/txnSignature";

const secret = process.env.NEXTAUTH_SECRET;

const connection = new Connection(process.env.BACKEND_RPC!);

let devWalletKey = Keypair.fromSecretKey(bs58.decode(process.env.DEV_KEYPAIR!));

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

      const token = await getToken({ req, secret });

      if (!token || !token.sub || token.sub != wallet)
        return res.send({
          error: "User wallet not authenticated",
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

      let vTxn = await createWithdrawTxn(
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

      let tier = 0;
      let multiplier = 0.5;
      let checkAmt = user.stakedAmount - amount

      Object.entries(tiers).some(([key, value], index) => {
        if (checkAmt >= 600000) {
          tier = 7;
          multiplier = 2;
          return true;
        } else if (checkAmt < value.limit) {
          tier = index;
          multiplier = value.multiplier;
          return true;
        }
      });

      const result = await User.findOneAndUpdate(
        {
          wallet,
        },
        {
          $inc: { stakedAmount: -amount },
          tier: tier,
          multiplier: multiplier,
        },
        { new: true },
      );

      if (!result) {
        throw new Error(
          "Unstake failed: insufficient funds or user not found",
        );
      }

      txn.partialSign(devWalletKey);

      let txnSignature = await sendAndConfirmRawTransaction(
        connection,
        txn.serialize(),
        {
          commitment: "confirmed",
          skipPreflight: true,
        },
      );

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

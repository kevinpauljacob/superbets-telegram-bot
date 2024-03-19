import {
  Connection,
  PublicKey,
  Transaction,
  sendAndConfirmRawTransaction,
} from "@solana/web3.js";
import {
  createDepositTxn,
  verifyFrontendTransaction,
} from "../../../../context/gameTransactions";
import connectDatabase from "../../../../utils/database";
import Deposit from "../../../../models/games/deposit";
import User from "../../../../models/games/user";
import House from "../../../../models/games/house";
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
      "Content-Type, Authorization"
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
        tokenMint != "SOL"
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
        tokenMint
      );

      const txn = Transaction.from(
        Buffer.from(transactionBase64 as string, "base64")
      );

      if (!verifyFrontendTransaction(txn, vTxn))
        return res
          .status(400)
          .json({ success: false, message: "Transaction verfication failed" });

      let txnSignature = await sendAndConfirmRawTransaction(
        connection,
        txn.serialize(),
        {
          commitment: "confirmed",
          skipPreflight: true,
        }
      );

      await TxnSignature.create({ txnSignature });

      let user = await User.findOne({ wallet });

      if (!user)
        await User.create({
          wallet,
          deposit: [{ tokenMint, amount: amount }],
        });
      else
        await User.findOneAndUpdate(
          {
            wallet,
            deposit: {
              $elemMatch: {
                tokenMint,
              },
            },
          },
          {
            $inc: { "deposit.$.amount": amount },
          },
          { new: true }
        );

      await Deposit.create({
        wallet,
        amount,
        type: true,
        tokenMint,
        txnSignature,
      });

      await House.findOneAndUpdate(
        {},
        {
          $inc: { houseBalance: amount },
        }
      );

      return res.json({
        success: true,
        message: `${amount} SOL successfully deposited!`,
      });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}

export default handler;

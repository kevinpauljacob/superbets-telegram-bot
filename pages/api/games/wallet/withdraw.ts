import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmRawTransaction,
} from "@solana/web3.js";
import {
  createWithdrawTxn,
  verifyFrontendTransaction,
} from "../../../../context/gameTransactions";
import connectDatabase from "../../../../utils/database";
import Deposit from "../../../../models/games/deposit";
import User from "../../../../models/games/user";
import House from "../../../../models/games/house";

import { getToken } from "next-auth/jwt";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import TxnSignature from "../../../../models/txnSignature";

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
      "Content-Type, Authorization"
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
        tokenMint != "SOL"
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

      if (
        user.deposit.find((d: any) => d.tokenMint === tokenMint)?.amount <
        amount
      )
        return res
          .status(400)
          .json({ success: false, message: "Insufficient balance !" });

      let vTxn = await createWithdrawTxn(
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

      const result = await User.findOneAndUpdate(
        {
          wallet,
          deposit: {
            $elemMatch: {
              tokenMint: tokenMint,
              amount: { $gte: amount },
            },
          },
        },
        {
          $inc: { "deposit.$.amount": -amount },
        },
        { new: true }
      );

      if (!result) {
        throw new Error(
          "Withdraw failed: insufficient funds or user not found"
        );
      }

      await House.findOneAndUpdate(
        {},
        {
          $inc: { houseBalance: -amount },
        }
      );

      txn.partialSign(devWalletKey);

      let txnSignature = await sendAndConfirmRawTransaction(
        connection,
        txn.serialize(),
        {
          commitment: "confirmed",
          skipPreflight: true,
        }
      );

      await TxnSignature.create({ txnSignature });

      await Deposit.create({
        wallet,
        amount,
        type: false,
        tokenMint,
        txnSignature,
      });

      return res.json({
        success: true,
        message: `${amount} SOL successfully withdrawn!`,
      });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}

export default handler;

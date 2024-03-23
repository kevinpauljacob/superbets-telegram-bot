import {
  BlockhashWithExpiryBlockHeight,
  Connection,
  PublicKey,
  Transaction,
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
import { NextApiRequest, NextApiResponse } from "next";

const secret = process.env.NEXTAUTH_SECRET;

const connection = new Connection(process.env.BACKEND_RPC!);

export const config = {
  maxDuration: 60,
};

type InputType = {
  transactionBase64: string;
  wallet: string;
  amount: number;
  tokenMint: string;
  blockhashWithExpiryBlockHeight: BlockhashWithExpiryBlockHeight;
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
      }: InputType = req.body;

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
        tokenMint != "SOL" ||
        !blockhashWithExpiryBlockHeight
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

      if (!verifyFrontendTransaction(txn, vTxn))
        return res
          .status(400)
          .json({ success: false, message: "Transaction verfication failed" });

      const txnSignature = await connection.sendRawTransaction(txn.serialize());
      const confirmation = await connection.confirmTransaction(
        {
          signature: txnSignature,
          ...blockhashWithExpiryBlockHeight,
        },
        "confirmed",
      );

      if (confirmation.value.err)
        return res
          .status(400)
          .json({ success: false, message: confirmation.value.err.toString() });

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
          { new: true },
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
        },
      );

      return res.json({
        success: true,
        message: `${amount} SOL successfully deposited!`,
      });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  } else {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }
}

export default handler;

import {
  BlockhashWithExpiryBlockHeight,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import {
  createWithdrawTxn,
  retryTxn,
  verifyFrontendTransaction,
} from "../../../../context/gameTransactions";
import connectDatabase from "../../../../utils/database";
import Deposit from "../../../../models/games/deposit";
import User from "../../../../models/games/gameUser";
import House from "../../../../models/games/house";

import { getToken } from "next-auth/jwt";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import TxnSignature from "../../../../models/txnSignature";
import { NextApiRequest, NextApiResponse } from "next";

const secret = process.env.NEXTAUTH_SECRET;

const connection = new Connection(process.env.BACKEND_RPC!);

let devWalletKey = Keypair.fromSecretKey(bs58.decode(process.env.DEV_KEYPAIR!));

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
        return res.send({
          error: "User wallet not authenticated",
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

      let { transaction: vTxn } = await createWithdrawTxn(
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
        { new: true },
      );

      if (!result) {
        throw new Error(
          "Withdraw failed: insufficient funds or user not found",
        );
      }

      await House.findOneAndUpdate(
        {},
        {
          $inc: { houseBalance: -amount },
        },
      );

      txn.partialSign(devWalletKey);

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
  } else
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
}

export default handler;

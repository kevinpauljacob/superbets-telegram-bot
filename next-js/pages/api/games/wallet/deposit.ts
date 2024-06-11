import {
  BlockhashWithExpiryBlockHeight,
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import {
  createDepositTxn,
  retryTxn,
  verifyFrontendTransaction,
} from "../../../../context/gameTransactions";
import connectDatabase from "../../../../utils/database";
import Deposit from "../../../../models/games/deposit";
import User from "../../../../models/games/gameUser";
import TxnSignature from "../../../../models/txnSignature";

import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import Campaign from "@/models/analytics/campaigns";
import { SPL_TOKENS } from "@/context/config";

const secret = process.env.NEXTAUTH_SECRET;

const connection = new Connection(process.env.BACKEND_RPC!, "confirmed");

export const config = {
  maxDuration: 60,
};

type InputType = {
  transactionBase64: string;
  wallet: string;
  amount: number;
  tokenMint: string;
  blockhashWithExpiryBlockHeight: BlockhashWithExpiryBlockHeight;
  campaignId: string;
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
        campaignId,
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
        !blockhashWithExpiryBlockHeight
      )
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      if (
        typeof amount !== "number" ||
        !isFinite(amount) ||
        !(amount > 0) ||
        !SPL_TOKENS.some((t) => t.tokenMint === tokenMint)
      )
        return res
          .status(400)
          .json({ success: false, message: "Invalid parameters!" });

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

      const txnSignature = await retryTxn(
        connection,
        txn,
        blockhashWithExpiryBlockHeight,
      );

      await TxnSignature.create({ txnSignature });

      const user = await User.findOne({ wallet });
      if (!user)
        await User.create({ wallet, deposit: [{ tokenMint, amount }] });
      else {
        await User.findOneAndUpdate(
          {
            wallet,
            "deposit.tokenMint": { $ne: tokenMint },
          },
          {
            $push: { deposit: { tokenMint, amount: 0 } },
          },
        );

        await User.findOneAndUpdate(
          {
            wallet,
            "deposit.tokenMint": tokenMint,
          },
          {
            $inc: { "deposit.$.amount": amount },
          },
        );
      }

      await Deposit.create({
        wallet,
        amount,
        type: true,
        tokenMint,
        txnSignature,
      });

      if (campaignId) {
        try {
          await Campaign.create({
            wallet,
            amount,
            campaignId,
          });
        } catch (e) {
          console.log("unable to create campaign !");
        }
      }
      const tokenName = SPL_TOKENS.find((t) => t.tokenMint === tokenMint)
        ?.tokenName;

      return res.json({
        success: true,
        message: `${amount} ${tokenName} successfully deposited!`,
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

import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { Referral } from "@/models/games";
import { getToken } from "next-auth/jwt";
import {
  createClaimEarningsTxn,
  retryTxn,
  verifyFrontendTransaction,
} from "@/context/gameTransactions";
import {
  BlockhashWithExpiryBlockHeight,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import TxnSignature from "@/models/txnSignature";

const secret = process.env.NEXTAUTH_SECRET;

const connection = new Connection(process.env.BACKEND_RPC!, "confirmed");

const devWalletKey = Keypair.fromSecretKey(
  bs58.decode(process.env.DEV_KEYPAIR!),
);

export const config = {
  maxDuration: 60,
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const { wallet } = req.query;

      if (!wallet)
        return res
          .status(400)
          .json({ success: false, message: "Wallet is required!" });

      await connectDatabase();

      const referral = await Referral.findOne({ wallet });
      const a = await Referral.findOne({
        referredByChain: { $in: [referral._id] },
      });

      return res.json({
        success: true,
        data: a,
        message: `Data fetch successful!`,
      });
    } else if (req.method === "POST") {
      type InputType = {
        transactionBase64: string;
        wallet: string;
        blockhashWithExpiryBlockHeight: BlockhashWithExpiryBlockHeight;
      };

      const {
        transactionBase64,
        wallet,
        blockhashWithExpiryBlockHeight,
      }: InputType = req.body;

      const token = await getToken({ req, secret });

      if (!token || !token.sub || token.sub != wallet)
        return res.status(400).json({
          success: false,
          message: "User wallet not authenticated",
        });

      if (!wallet || !transactionBase64 || !blockhashWithExpiryBlockHeight)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters!" });

      await connectDatabase();

      const info = await Referral.findOne({ wallet });

      if (!info)
        return res
          .status(400)
          .json({ success: false, message: "Wallet info not found!" });

      const earnings = info.earnings.map((e: any) => {
        return { tokenMint: e.tokenMint, amount: e.amount };
      });

      const { transaction: vTxn } = await createClaimEarningsTxn(
        new PublicKey(wallet),
        earnings,
      );

      const txn = Transaction.from(
        Buffer.from(transactionBase64 as string, "base64"),
      );

      if (!verifyFrontendTransaction(txn, vTxn))
        return res
          .status(400)
          .json({ success: false, message: "Transaction verfication failed" });

      txn.partialSign(devWalletKey);

      const txnSignature = await retryTxn(
        connection,
        txn,
        blockhashWithExpiryBlockHeight,
      );

      await TxnSignature.create({ txnSignature });

      return res.json({
        success: true,
        message: `Earnings claimed successfully!`,
      });
    } else
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed!" });
  } catch (e: any) {
    console.log(e);
    return res.status(500).json({ success: false, message: e.message });
  }
}

export default handler;

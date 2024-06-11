import connectDatabase from "../../../../../../utils/database";
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
    if (req.method !== "POST")
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed!" });

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

    const referral = await Referral.findOne({ wallet });

    if (!referral)
      return res
        .status(400)
        .json({ success: false, message: "Wallet info not found!" });

    const earnings = referral.unclaimedEarnings.map((e: any) => {
      return { tokenMint: e.tokenMint, amount: e.amount };
    });

    referral.unclaimedEarnings.forEach((e: any) => {
      e.amount = 0;
    });
    referral.save();

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
  } catch (e: any) {
    console.log(e);
    return res.status(500).json({ success: false, message: e.message });
  }
}

export default handler;

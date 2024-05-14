import type { NextApiRequest, NextApiResponse } from "next";
import connectDatabase from "@/utils/database";
import Deposit from "@/models/deposit";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";

const connection = new Connection(process.env.BACKEND_RPC!, "confirmed");

const devWalletKey = Keypair.fromSecretKey(
  bs58.decode(process.env.DEV_KEYPAIR!)
);

export const config = {
  maxDuration: 120,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST")
    try {
      await connectDatabase();
      const pendingWithdrawals = await Deposit.find({ status: "pending" });

      if (pendingWithdrawals.length === 0)
        return res.status(200).json({ success: true, withdrawals: 0 });

      const groupSize = 5;
      const groupedWithdrawals = Array.from(
        { length: Math.ceil(pendingWithdrawals.length / groupSize) },
        (v, i) =>
          pendingWithdrawals.slice(i * groupSize, i * groupSize + groupSize)
      );

      const transactions: Transaction[] = [];
      const blockhashWithExpiryBlockHeight =
        await connection.getLatestBlockhash("processed");

      for (const group of groupedWithdrawals) {
        const transaction = new Transaction();
        transaction.feePayer = devWalletKey.publicKey;
        transaction.recentBlockhash = blockhashWithExpiryBlockHeight.blockhash;

        for (const withdrawal of group) {
          transaction.add(
            SystemProgram.transfer({
              fromPubkey: devWalletKey.publicKey,
              toPubkey: new PublicKey(withdrawal.wallet),
              lamports: Math.floor(withdrawal.amount * 10 ** 9),
            })
          );
        }
        transaction.partialSign(devWalletKey);
        transactions.push(transaction);
      }

      await Promise.allSettled(
        transactions.map(async (txn) => {
          const signature = await connection.sendRawTransaction(
            txn.serialize()
          );

          const response = await connection.confirmTransaction({
            signature,
            ...blockhashWithExpiryBlockHeight,
          });

          if (response.value?.err) {
            throw new Error(response.value.err.toString());
          }

          return signature;
        })
      ).then(async (results) => {
        for (let index = 0; index < results.length; ++index) {
          if (results[index].status === "fulfilled") {
            for (const withdrawal of groupedWithdrawals[index]) {
              await Deposit.findOneAndUpdate(
                { _id: withdrawal._id },
                {
                  status: "completed",
                  txnSignature: (results[index] as any).value,
                }
              );
            }
          }
        }
      });

      return res
        .status(200)
        .json({ success: true, withdrawals: pendingWithdrawals.length });
    } catch (error: any) {
      console.log(error);
      res.status(500).json({ success: false, message: error.message });
    }
  else {
    res.status(405).json({ success: false, message: "Method not allowed" });
  }
}

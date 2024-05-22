import type { NextApiRequest, NextApiResponse } from "next";
import connectDatabase from "@/utils/database";
import Deposit from "@/models/deposit";
import {
  BlockhashWithExpiryBlockHeight,
  ComputeBudgetProgram,
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
const groupSize = 5;

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
      await Deposit.updateMany(
        {
          _id: {
            $in: pendingWithdrawals.map((withdrawal) => withdrawal._id),
          },
          status: "pending",
        },
        {
          status: "completed",
        }
      );

      if (pendingWithdrawals.length === 0)
        return res.status(200).json({ success: true, withdrawals: 0 });

      const groupedWithdrawals = Array.from(
        { length: Math.ceil(pendingWithdrawals.length / groupSize) },
        (v, i) =>
          pendingWithdrawals.slice(i * groupSize, i * groupSize + groupSize)
      );

      const transactions: Transaction[] = [];
      const blockhashWithExpiryBlockHeight =
        await connection.getLatestBlockhash();

      for (const group of groupedWithdrawals) {
        const transaction = new Transaction();
        transaction.feePayer = devWalletKey.publicKey;
        transaction.recentBlockhash = blockhashWithExpiryBlockHeight.blockhash;

        transaction.add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: 100_000 }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 150_000 })
        );

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
        transactions.map(async (txn, index) => {
          let signature = "";

          try {
            signature = await retryTxn(
              connection,
              txn,
              blockhashWithExpiryBlockHeight
            );
          } catch (error) {
            console.log("Error in catch", error);

            const txnInfo = await connection.getTransaction(signature, {
              commitment: "confirmed",
              maxSupportedTransactionVersion: 0,
            });

            console.log("Txn Info", txnInfo);
            if (!txnInfo) {
              await Deposit.updateMany(
                {
                  _id: {
                    $in: groupedWithdrawals[index].map(
                      (withdrawal) => withdrawal._id
                    ),
                  },
                  status: "completed",
                },
                {
                  status: "pending",
                }
              );

              throw new Error("Transaction not found!");
            }
          }

          return signature;
        })
      ).then(async (results) => {
        console.log(results);

        for (let index = 0; index < results.length; ++index) {
          if (results[index].status === "fulfilled") {
            for (let i = 0; i < groupedWithdrawals[index].length; i++) {
              const txnSignature = (results[index] as any).value + "-" + i;

              await Deposit.findOneAndUpdate(
                { _id: groupedWithdrawals[index][i]._id },
                {
                  txnSignature,
                }
              );
            }
          }
        }
      });

      return res.json({
        success: true,
        withdrawals: pendingWithdrawals.length,
      });
    } catch (error: any) {
      console.log(error);
      res.status(500).json({ success: false, message: error.message });
    }
  else {
    res.status(405).json({ success: false, message: "Method not allowed" });
  }
}

async function retryTxn(
  connection: Connection,
  transaction: Transaction,
  blockhashContext: BlockhashWithExpiryBlockHeight
) {
  const { blockhash, lastValidBlockHeight } = blockhashContext;
  let blockheight = await connection.getBlockHeight();

  let flag = true;

  let finalTxn = "";

  let txn = "";

  let j = 0;

  while (blockheight < lastValidBlockHeight && flag) {
    txn = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: true,
      maxRetries: 0,
    });
    await new Promise((r) => setTimeout(r, 5000));
    console.log("retry count: ", ++j);
    connection
      .confirmTransaction({
        lastValidBlockHeight,
        blockhash,
        signature: txn,
      })
      .then((data) => {
        if ((data.value as any).confirmationStatus) {
          console.log("confirmed txn", data.value, txn);
          finalTxn = txn;
          flag = false;
        }
      })
      .catch((e) => {
        finalTxn = "";
        flag = false;
        console.log(e);
      });

    blockheight = await connection.getBlockHeight();
  }

  if (finalTxn) return finalTxn;
  else throw new Error("Transaction could not be confirmed !");
}

import connectDatabase from "./utils/database";
import HouseTransfer from "./models/houseTransfer";
import Deposit from "./models/deposit";
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
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connection = new Connection(process.env.BACKEND_RPC!, "confirmed");

const hotDevWalletKey = Keypair.fromSecretKey(
  bs58.decode(process.env.DEV_KEYPAIR!)
);
const coldDevWalletKey = Keypair.fromSecretKey(
  bs58.decode(process.env.COLD_DEV_KEYPAIR!)
);

const handlePendingWithdrawals = async (connection: Connection) => {
  const groupSize = 10;

  const pendingWithdrawals = await Deposit.find({
    status: "pending",
    type: false,
  });

  if (pendingWithdrawals.length === 0)
    return { withdrawals: 0, message: "No pending withdrawals" };

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

  const groupedWithdrawals = Array.from(
    { length: Math.ceil(pendingWithdrawals.length / groupSize) },
    (v, i) => pendingWithdrawals.slice(i * groupSize, i * groupSize + groupSize)
  );

  const transactions: Transaction[] = [];
  const blockhashWithExpiryBlockHeight = await connection.getLatestBlockhash();

  for (const group of groupedWithdrawals) {
    const transaction = new Transaction();
    transaction.feePayer = hotDevWalletKey.publicKey;
    transaction.recentBlockhash = blockhashWithExpiryBlockHeight.blockhash;

    addPriorityFeeInstruction(transaction);

    for (const withdrawal of group) {
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: hotDevWalletKey.publicKey,
          toPubkey: new PublicKey(withdrawal.wallet),
          lamports: Math.floor(withdrawal.amount * 10 ** 9),
        })
      );
    }
    transaction.partialSign(hotDevWalletKey);
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
          const txnSignature = (results[index] as any).value + " - " + i;

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

  return {
    withdrawals: pendingWithdrawals.length,
    message: "Withdrawals processed",
  };
};

const handleHouseWallet = async (connection: Connection) => {
  const hotWalletLimit = {
    min: 10,
    max: 100,
  };
  const transferAmount = {
    hotToCold: 50,
    coldToHot: 50,
  };
  const bufferAmount = 0.01;

  if (hotDevWalletKey.publicKey.equals(coldDevWalletKey.publicKey))
    throw new Error("Cold and Hot Wallets cannot be same");

  const hotWalletInfo = await connection.getAccountInfo(
    hotDevWalletKey.publicKey
  );

  if (!hotWalletInfo) throw new Error("Hot Wallet not found");

  const currHotBalance = hotWalletInfo.lamports / 10 ** 9;

  if (
    hotWalletLimit.min < currHotBalance &&
    currHotBalance < hotWalletLimit.max
  ) {
    return { message: "No action required" };
  }

  const blockhashWithExpiryBlockHeight = await connection.getLatestBlockhash();

  const transaction = new Transaction();
  transaction.recentBlockhash = blockhashWithExpiryBlockHeight.blockhash;
  addPriorityFeeInstruction(transaction);

  let message = "";
  let amount = 0;

  if (currHotBalance > hotWalletLimit.max) {
    amount = transferAmount.hotToCold - bufferAmount;

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: hotDevWalletKey.publicKey,
        toPubkey: coldDevWalletKey.publicKey,
        lamports: Math.floor(amount * 10 ** 9),
      })
    );

    transaction.feePayer = hotDevWalletKey.publicKey;
    transaction.partialSign(hotDevWalletKey);
    message = "hot-to-cold";
  } else if (currHotBalance < hotWalletLimit.min) {
    const coldWalletInfo = await connection.getAccountInfo(
      coldDevWalletKey.publicKey
    );

    if (!coldWalletInfo) throw new Error("Cold Wallet not found");

    const currColdBalance = coldWalletInfo.lamports / 10 ** 9;

    amount = Math.min(transferAmount.coldToHot, currColdBalance) - bufferAmount;

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: coldDevWalletKey.publicKey,
        toPubkey: hotDevWalletKey.publicKey,
        lamports: Math.floor(amount * 10 ** 9),
      })
    );

    transaction.feePayer = coldDevWalletKey.publicKey;
    transaction.partialSign(coldDevWalletKey);
    message = "cold-to-hot";
  }

  const signature = await retryTxn(
    connection,
    transaction,
    blockhashWithExpiryBlockHeight
  );

  await HouseTransfer.create({
    tokenMint: "SOL",
    type: message,
    amount,
    txnSignature: signature,
  });

  return { message, amount, signature };
};

const addPriorityFeeInstruction = (transaction: Transaction) => {
  transaction.add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 100_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 150_000 })
  );
};

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
    await new Promise((r) => setTimeout(r, 2000));
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

async function main() {
  try {
    await connectDatabase();

    // await handleHouseWallet(connection)
    //   .then((result) => {
    //     console.log("House Wallet", result);
    //   })
    //   .catch((error) => {
    //     console.log("Error in House Wallet", error);
    //   });

    await handlePendingWithdrawals(connection)
      .then((result) => {
        console.log("Withdrawals", result);
      })
      .catch((error) => {
        console.log("Error in Withdrawal", error);
      });

    return;
  } catch (error) {
    console.log(error);
    return;
  } finally {
    await mongoose.disconnect();
    return;
  }
}

main();

import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import {
  AddressLookupTableAccount,
  BlockhashWithExpiryBlockHeight,
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import connectDatabase from "./database";
import crypto from "crypto";
import { Deposits, User } from "../models";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import dotenv from "dotenv";
import { Deposit } from "./processTransaction";

export type spl_token = {
  tokenName: string;
  tokenMint: string;
  decimal: number;
  luloEnabled: boolean;
};

const SPL_TOKENS: Array<spl_token> = [
  {
    tokenName: "SOL",
    tokenMint: "SOL", //So11111111111111111111111111111111111111112
    decimal: 9,
    luloEnabled: true,
  },
  {
    tokenName: "USDC",
    tokenMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimal: 6,
    luloEnabled: true,
  },
];

dotenv.config();
const connection = new Connection(process.env.BACKEND_RPC!);
const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");

export const decryptServerSeed = (
  encryptedServerSeed: string,
  key: Buffer,
  iv: Buffer
) => {
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedServerSeed, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

export const createDepositTxn = async (
  wallet: PublicKey,
  encryptedKey: string,
  iv: string,
  amount: number,
  tokenMint: string,
  devPublicKey: PublicKey
) => {
  let transaction = new Transaction();
  let { tokenName, decimal } = SPL_TOKENS.find(
    (data) => data.tokenMint === tokenMint
  )!;

  const blockhashWithExpiryBlockHeight = await connection.getLatestBlockhash();
  transaction.feePayer = wallet;
  transaction.recentBlockhash = blockhashWithExpiryBlockHeight.blockhash;

  transaction.add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 100_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 150_000 })
  );
  console.log("from: ", wallet);
  console.log("to: ", devPublicKey);
  if (tokenName === "SOL")
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: wallet,
        toPubkey: devPublicKey,
        lamports: Math.floor(amount * Math.pow(10, 9)),
      })
    );
  else {
    const tokenId = new PublicKey(tokenMint);
    const userAta = await getAssociatedTokenAddress(tokenId, wallet);
    const devAta = await getAssociatedTokenAddress(tokenId, devPublicKey);
    transaction.add(
      createTransferInstruction(
        userAta,
        devAta,
        wallet,
        Math.floor(amount * Math.pow(10, decimal))
      )
    );
  }
  console.log("decrypting", encryptedKey, encryptionKey, iv);
  const privateKey = decryptServerSeed(
    encryptedKey,
    encryptionKey,
    Buffer.from(iv, "hex")
  );

  const secretKey = bs58.decode(privateKey);
  console.log("secret", secretKey);
  const signer = Keypair.fromSecretKey(secretKey);
  transaction.partialSign(signer);

  // transaction.instructions.slice(2).forEach((i) => {
  //   i.keys.forEach((k) => {
  //     if (k.pubkey.equals(wallet)) {
  //       k.isSigner = true;
  //       k.isWritable = true;
  //     }
  //   });
  // });

  return { transaction, blockhashWithExpiryBlockHeight };
};

export const verifyTransaction = (
  transaction: Transaction,
  vTransaction: Transaction
) => {
  const transactionInstructions = JSON.stringify(
    transaction.instructions.filter(
      (i) => !i.programId.equals(ComputeBudgetProgram.programId)
    )
  );

  const vTransactionInstructions = JSON.stringify(
    vTransaction.instructions.filter(
      (i) => !i.programId.equals(ComputeBudgetProgram.programId)
    )
  );

  console.log(transactionInstructions);
  console.log(vTransactionInstructions);

  return transactionInstructions !== vTransactionInstructions;
};

export async function retryTxn(
  connection: Connection,
  transaction: Transaction | VersionedTransaction,
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

export async function createDeposit(
  token: string,
  amount: number,
  signature: string,
  wallet: string,
  comment: string,
  status: string
) {
  await connectDatabase();
  try {
    await Deposits.create({
      account: "",
      wallet,
      amount,
      type: true,
      tokenMint: "SOL",
      txnSignature: signature,
      status,
    });
  } catch (e) {
    console.log("Failed to create deposit for ", signature);
  }
}

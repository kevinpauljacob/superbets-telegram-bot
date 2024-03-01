import {
  PublicKey,
  Connection,
  Transaction,
  SystemProgram,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
} from "@solana/spl-token";
import toast from "react-hot-toast";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { translationsMap } from "@/components/GlobalContext";

export const connection = new Connection(process.env.NEXT_PUBLIC_RPC!);

const devPublicKey = new PublicKey(process.env.NEXT_PUBLIC_DEV_PUBLIC_KEY!);

export interface User {
  wallet: string;
  solAmount: number;
  keys: number;
  stakedAmount: number;
  tier: number;
  multiplier: number;
  points: number;
}

export const tiers = {
  0: { limit: 300, multiplier: 0.5 },
  1: { limit: 3000, multiplier: 1 },
  2: { limit: 15000, multiplier: 1.05 },
  3: { limit: 40000, multiplier: 1.15 },
  4: { limit: 75000, multiplier: 1.3 },
  5: { limit: 150000, multiplier: 1.5 },
  6: { limit: 600000, multiplier: 1.75 },
};

export const obfuscatePubKey = (address: string) => {
  return (
    address?.substring(0, 4) + "..." + address?.substring(address.length - 4)
  );
};

export const translator = (text: string, language: string) => {
  let result = "";
  Object.entries(translationsMap).map((obj, value) => {
    if (obj[0] === text) {
      switch (language) {
        case "en":
          result = text;
          break;
        case "ru":
          result = obj[1].ru;
          break;
        case "ko":
          result = obj[1].ko;
          break;
        case "ch":
          result = obj[1].ch;
          break;
        default:
          result = text;
          break;
      }
    }
  });
  return result;
};

export const stakeFOMO = async (
  wallet: WalletContextState,
  amount: number,
  tokenMint: string,
) => {
  if (amount == 0) {
    toast.error("Please enter an amount greater than 0");
    return { success: true, message: "Please enter an amount greater than 0" };
  }

  if (!wallet.publicKey) {
    toast.error("Wallet not connected");
    return { success: true, message: "Wallet not connected" };
  }

  let toastId = toast.loading("Staking in progress.");

  try {
    let { transaction, blockhash } = await createDepositTxn(
      wallet.publicKey,
      amount,
      tokenMint,
    );

    transaction = await wallet.signTransaction!(transaction);
    const transactionBase64 = transaction
      .serialize({
        requireAllSignatures: false,
      })
      .toString("base64");

    const res = await fetch(`/api/wallet/stake`, {
      method: "POST",
      body: JSON.stringify({
        blockhash,
        transactionBase64,
        wallet: wallet.publicKey,
        amount,
        tokenMint,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const { success, message } = await res.json();

    if (success === false) {
      toast.dismiss(toastId);
      toast.error(message);
      throw new Error(message);
    }

    toast.dismiss(toastId);

    toast.success("Stake successfull!");

    return { success: true, message };
  } catch (error) {
    toast.dismiss(toastId);
    toast.error("Unexpected error!");
    return { success: false, message: error };
  }
};

export const unstakeFOMO = async (
  wallet: WalletContextState,
  amount: number,
  tokenMint: string,
) => {
  if (amount == 0) {
    toast.error("Please enter an amount greater than 0");
    return { success: true, message: "Please enter an amount greater than 0" };
  }

  if (!wallet.publicKey) {
    toast.error("Wallet not connected");
    return { success: true, message: "Wallet not connected" };
  }

  let toastId = toast.loading("Unstaking in progress");

  try {
    let { transaction, blockhash } = await createWithdrawTxn(
      wallet.publicKey!,
      amount,
      tokenMint,
    );

    transaction = await wallet.signTransaction!(transaction);
    const transactionBase64 = transaction
      .serialize({
        requireAllSignatures: false,
      })
      .toString("base64");

    const res = await fetch(`/api/wallet/unstake`, {
      method: "POST",
      body: JSON.stringify({
        transactionBase64,
        wallet: wallet.publicKey,
        amount,
        tokenMint,
        blockhash,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const { success, message } = await res.json();

    if (success === false) {
      toast.dismiss(toastId);
      toast.error(message);
      throw new Error(message);
    }

    toast.dismiss(toastId);

    toast.success("Unstake successfull!");

    return { success: true, message };
  } catch (error) {
    toast.dismiss(toastId);

    toast.error("Unexpected error!");

    return { success: true, message: error };
  }
};

export const verifyTransaction = (
  transaction: Transaction,
  vTransaction: Transaction,
) => {
  const transactionInstructions = JSON.stringify(
    transaction.instructions.filter(
      (i) => !i.programId.equals(ComputeBudgetProgram.programId),
    ),
  );

  const vTransactionInstructions = JSON.stringify(vTransaction.instructions);

  return transactionInstructions === vTransactionInstructions;
};

export const createDepositTxn = async (
  wallet: PublicKey,
  amount: number,
  tokenMint: string,
) => {
  let transaction = new Transaction();

  let tokenName = "FOMO";
  let decimal = 9;

  transaction.feePayer = wallet;
  const blockhash = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash.blockhash;

  if (tokenName === "SOL")
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: wallet,
        toPubkey: devPublicKey,
        lamports: Math.floor(amount * Math.pow(10, 9)),
      }),
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
        Math.floor(amount * Math.pow(10, decimal)),
      ),
    );

    transaction.instructions[0].keys[2].isWritable = true;
  }

  return { transaction, blockhash };
};

export const createWithdrawTxn = async (
  wallet: PublicKey,
  amount: number,
  tokenMint: string,
) => {
  let transaction = new Transaction();

  let tokenName = "FOMO";
  let decimal = 9;

  transaction.feePayer = wallet;
  const blockhash = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash.blockhash;

  if (tokenName === "SOL") {
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: devPublicKey,
        toPubkey: wallet,
        lamports: Math.floor(amount * Math.pow(10, 9)),
      }),
    );
    transaction.instructions[0].keys[1].isSigner = true;
    transaction.instructions[0].keys[1].isWritable = true;
  } else {
    const tokenId = new PublicKey(tokenMint);
    const userAta = await getAssociatedTokenAddress(tokenId, wallet);
    const devAta = await getAssociatedTokenAddress(tokenId, devPublicKey);

    transaction.add(
      createTransferInstruction(
        devAta,
        userAta,
        devPublicKey,
        Math.floor(amount * Math.pow(10, decimal)),
      ),
    );

    transaction.instructions[0].keys[2].isSigner = true;
    transaction.instructions[0].keys[2].isWritable = true;
  }

  return { transaction, blockhash };
};

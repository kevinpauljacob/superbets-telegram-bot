import {
  PublicKey,
  Connection,
  Transaction,
  SystemProgram,
  ComputeBudgetProgram,
  BlockhashWithExpiryBlockHeight,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
} from "@solana/spl-token";
import { SPL_TOKENS } from "./config";
import toast from "react-hot-toast";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { errorCustom, successCustom } from "@/components/toasts/ToastGroup";

export const connection = new Connection(
  process.env.NEXT_PUBLIC_RPC!,
  "processed",
);

export const wsEndpoint = process.env.NEXT_PUBLIC_WS_ENDPOINT!;

const devPublicKey = new PublicKey(process.env.NEXT_PUBLIC_DEV_PUBLIC_KEY!);

export const minGameAmount = 1e-6;

export const timeWeightedAvgInterval = 24 * 60 * 60 * 1000;
export const timeWeightedAvgLimit = 100;

export const placeBet = async (
  wallet: WalletContextState,
  amount: number,
  tokenMint: string,
  betType: string,
  timeFrame: number,
) => {
  try {
    const res = await fetch(`/api/games/options`, {
      method: "POST",
      body: JSON.stringify({
        wallet: wallet.publicKey,
        amount: amount,
        tokenMint,
        betType,
        timeFrame,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const { success, message, data } = await res.json();

    if (success === false) {
      errorCustom(message);
      throw new Error(message);
    }

    successCustom("Bet placed successfully!");

    return { success, message, data };
  } catch (error) {
    return { success: false, message: "Unexpected error", data: null };
  }
};

export const placeFlip = async (
  wallet: WalletContextState,
  amount: number,
  flipType: string, // heads / tails
) => {
  try {
    if (!wallet.publicKey) throw new Error("Wallet not connected");

    if (flipType == null) throw new Error("Invalid flip type");

    const res = await fetch(`/api/games/coin`, {
      method: "POST",
      body: JSON.stringify({
        wallet: wallet.publicKey,
        amount,
        flipType,
        tokenMint: "SOL",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const { success, message, data } = await res.json();
    if (!success) throw new Error(message);

    return { success, message, data };
  } catch (error: any) {
    return { success: false, message: error.message, data: null };
  }
};

export const deposit = async (
  wallet: WalletContextState,
  amount: number,
  tokenMint: string,
) => {
  if (amount == 0) {
    errorCustom("Please enter an amount greater than 0");
    return { success: true, message: "Please enter an amount greater than 0" };
  }

  if (!wallet.publicKey) {
    errorCustom("Wallet not connected");
    return { success: true, message: "Wallet not connected" };
  }

  try {
    let { transaction, blockhashWithExpiryBlockHeight } =
      await createDepositTxn(wallet.publicKey, amount, tokenMint);

    transaction = await wallet.signTransaction!(transaction);
    const transactionBase64 = transaction
      .serialize({
        requireAllSignatures: false,
      })
      .toString("base64");

    const res = await fetch(`/api/games/wallet/deposit`, {
      method: "POST",
      body: JSON.stringify({
        transactionBase64,
        wallet: wallet.publicKey,
        amount,
        tokenMint,
        blockhashWithExpiryBlockHeight,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const { success, message } = await res.json();

    if (success === false) {
      errorCustom(message);
      throw new Error(message);
    }

    successCustom("Deposit successfull!");

    return { success: true, message };
  } catch (error) {
    errorCustom("Unexpected error!");
    return { success: false, message: error };
  }
};

export const withdraw = async (
  wallet: WalletContextState,
  amount: number,
  tokenMint: string,
) => {
  if (amount == 0) {
    errorCustom("Please enter an amount greater than 0");
    return { success: true, message: "Please enter an amount greater than 0" };
  }

  if (!wallet.publicKey) {
    errorCustom("Wallet not connected");
    return { success: true, message: "Wallet not connected" };
  }

  try {
    let { transaction, blockhashWithExpiryBlockHeight } =
      await createWithdrawTxn(wallet.publicKey!, amount, tokenMint);

    transaction = await wallet.signTransaction!(transaction);
    const transactionBase64 = transaction
      .serialize({
        requireAllSignatures: false,
      })
      .toString("base64");

    const res = await fetch(`/api/games/wallet/withdraw`, {
      method: "POST",
      body: JSON.stringify({
        transactionBase64,
        wallet: wallet.publicKey,
        amount,
        tokenMint,
        blockhashWithExpiryBlockHeight,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const { success, message } = await res.json();

    if (success === false) {
      errorCustom(message);
      throw new Error(message);
    }

    successCustom("Withdrawal successfull!");

    return { success: true, message };
  } catch (error) {
    errorCustom("Unexpected error!");

    return { success: true, message: error };
  }
};

export const checkResult = async (wallet: WalletContextState) => {
  try {
    const res = await fetch(`/api/games/options/checkResult`, {
      method: "POST",
      body: JSON.stringify({
        wallet: wallet.publicKey,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const { success, message, data } = await res.json();

    if (success === false) {
      errorCustom(message);
      throw new Error(message);
    }

    return { success, message, data };
  } catch (error: any) {
    errorCustom("Unexpected error! Please try again.");

    return {
      success: false,
      message: "Unexpected error! Please try again",
      data: null,
    };
  }
};

export const getDecimals = async (owner: any, tokenMint: any) => {
  try {
    let ownerTokenAccount = await getAssociatedTokenAddress(tokenMint, owner);
    const tokenAccount: any =
      await connection.getParsedAccountInfo(ownerTokenAccount);
    let decimal = tokenAccount.value.data.parsed.info.tokenAmount.decimals;
    return decimal;
  } catch {
    return null;
  }
};

export const verifyFrontendTransaction = (
  transaction: Transaction,
  verificationTransaction: Transaction,
) => {
  const transactionInstructions = JSON.stringify(
    transaction.instructions.filter(
      (i) => !i.programId.equals(ComputeBudgetProgram.programId),
    ),
  );

  const verificationTransactionInstructions = JSON.stringify(
    verificationTransaction.instructions,
  );

  console.log(transactionInstructions, verificationTransactionInstructions);

  return transactionInstructions === verificationTransactionInstructions;
};

export const createDepositTxn = async (
  wallet: PublicKey,
  amount: number,
  tokenMint: string,
) => {
  let transaction = new Transaction();
  let { tokenName, decimal } = SPL_TOKENS.find(
    (data) => data.tokenMint === tokenMint,
  )!;

  const blockhashWithExpiryBlockHeight = await connection.getLatestBlockhash();
  transaction.feePayer = wallet;
  transaction.recentBlockhash = blockhashWithExpiryBlockHeight.blockhash;

  if (tokenName === "SOL")
    transaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 100_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 150_000 }),
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
      ComputeBudgetProgram.setComputeUnitLimit({ units: 100_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 150_000 }),
      createTransferInstruction(
        userAta,
        devAta,
        wallet,
        Math.floor(amount * Math.pow(10, decimal)),
      ),
    );
  }

  return { transaction, blockhashWithExpiryBlockHeight };
};

export const createWithdrawTxn = async (
  wallet: PublicKey,
  amount: number,
  tokenMint: string,
) => {
  let transaction = new Transaction();

  let { tokenName, decimal } = SPL_TOKENS.find(
    (data) => data.tokenMint === tokenMint,
  )!;

  transaction.feePayer = wallet;
  const blockhashWithExpiryBlockHeight = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhashWithExpiryBlockHeight.blockhash;

  if (tokenName === "SOL") {
    transaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 100_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 150_000 }),
      SystemProgram.transfer({
        fromPubkey: devPublicKey,
        toPubkey: wallet,
        lamports: Math.floor(amount * Math.pow(10, 9)),
      }),
    );
    transaction.instructions[2].keys[1].isSigner = true;
    transaction.instructions[2].keys[1].isWritable = true;
  } else {
    const tokenId = new PublicKey(tokenMint);
    const userAta = await getAssociatedTokenAddress(tokenId, wallet);
    const devAta = await getAssociatedTokenAddress(tokenId, devPublicKey);
    transaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 100_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 150_000 }),
      createTransferInstruction(
        devAta,
        userAta,
        devPublicKey,
        Math.floor(amount * Math.pow(10, decimal)),
      ),
    );
    transaction.instructions[2].keys[2].isSigner = true;
    transaction.instructions[2].keys[2].isWritable = true;
  }

  return { transaction, blockhashWithExpiryBlockHeight };
};

export async function retryTxn(
  connection: Connection,
  transaction: Transaction,
  blockhashContext: BlockhashWithExpiryBlockHeight,
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
    });
    await new Promise((r) => setTimeout(r, 3000));
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

export const rollDice = async (
  wallet: WalletContextState,
  amount: number,
  chosenNumbers: number[],
) => {
  try {
    if (!wallet.publicKey) throw new Error("Wallet not connected");

    const res = await fetch(`/api/games/dice`, {
      method: "POST",
      body: JSON.stringify({
        wallet: wallet.publicKey,
        amount: amount,
        tokenMint: "SOL",
        chosenNumbers,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const { success, message, data } = await res.json();

    if (success != true) {
      errorCustom(message);
      throw new Error(message);
    }

    if (data.result == "Won") successCustom(message);
    else errorCustom(message);

    return { success, message, data };
  } catch (error) {
    return { success: false, message: "Unexpected error", data: null };
  }
};

export const limboBet = async (
  wallet: WalletContextState,
  amount: number,
  chance: number,
) => {
  try {
    if (!wallet.publicKey) throw new Error("Wallet not connected");

    const res = await fetch(`/api/games/limbo`, {
      method: "POST",
      body: JSON.stringify({
        wallet: wallet.publicKey,
        amount: amount,
        tokenMint: "SOL",
        chance,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    return data;
  } catch (error: any) {
    return { success: false, message: error.message, data: null };
  }
};

export function trimStringToLength(str: string, desiredLength: number): string {
  return (
    str.substring(0, desiredLength) +
    "..." +
    str.substring(str.length - desiredLength, str.length)
  );
}

export const truncateNumber = (num: number, numOfDecimals: number) => {
  const [whole, decimal] = num.toString().split(".");
  return parseFloat(whole + "." + (decimal || "").slice(0, numOfDecimals));
};

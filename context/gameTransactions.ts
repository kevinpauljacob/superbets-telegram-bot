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
import { SPL_TOKENS } from "./config";
import toast from "react-hot-toast";
import { WalletContextState } from "@solana/wallet-adapter-react";

export const connection = new Connection(process.env.NEXT_PUBLIC_RPC!);

const devPublicKey = new PublicKey(process.env.NEXT_PUBLIC_DEV_PUBLIC_KEY!);

export const minGameAmount = 1e-6;

export const placeBet = async (
  wallet: WalletContextState,
  amount: number,
  tokenMint: string,
  betType: boolean,
  timeFrame: number,
) => {
  // let toastId = toast.loading("betting in progress");

  try {
    const res = await fetch(`/api/games/options/bet`, {
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
      // toast.dismiss(toastId);
      toast.error(message);
      throw new Error(message);
    }

    // toast.dismiss(toastId);

    toast.success("Bet placed successfully!", { duration: 2000 });

    return { success, message, data };
  } catch (error) {
    // toast.dismiss(toastId);

    // toast.error("error placing bet!");

    return { success: false, message: "Unexpected error", data: null };
  }
};

export const placeFlip = async (
  wallet: WalletContextState,
  amount: number,
  flipType: boolean, // true = heads, false = tails
) => {
  try {
    if (!wallet.publicKey) throw new Error("Wallet not connected");

    if (flipType == null) throw new Error("Invalid flip type");

    const res = await fetch(`/api/games/coin/flip`, {
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
    toast.error("Please enter an amount greater than 0");
    return { success: true, message: "Please enter an amount greater than 0" };
  }

  if (!wallet.publicKey) {
    toast.error("Wallet not connected");
    return { success: true, message: "Wallet not connected" };
  }

  let toastId = toast.loading("Deposit in progress");

  try {
    let {transaction, blockhashWithExpiryBlockHeight} = await createDepositTxn(
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
      toast.dismiss(toastId);
      toast.error(message);
      throw new Error(message);
    }

    toast.dismiss(toastId);

    toast.success("Deposit successfull!");

    return { success: true, message };
  } catch (error) {
    toast.dismiss(toastId);
    toast.error("Unexpected error!");
    return { success: false, message: error };
  }
};

export const withdraw = async (
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

  let toastId = toast.loading("Withdraw in progress");

  try {
    let transaction = await createWithdrawTxn(
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

    const res = await fetch(`/api/games/wallet/withdraw`, {
      method: "POST",
      body: JSON.stringify({
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

    toast.success("Withdrawal successfull!");

    return { success: true, message };
  } catch (error) {
    toast.dismiss(toastId);

    toast.error("Unexpected error!");

    return { success: true, message: error };
  }
};

export const checkResult = async (wallet: WalletContextState) => {
  let toastId = toast.loading("fomobet is processing the result");

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
      toast.dismiss(toastId);
      toast.error(message);
      throw new Error(message);
    }

    toast.dismiss(toastId);

    return { success, message, data };
  } catch (error: any) {
    toast.dismiss(toastId);

    toast.error("Unexpected error! Please try again.");

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
  }

  return { transaction, blockhashWithExpiryBlockHeight };
};

export const createWithdrawTxn = async (
  wallet: PublicKey,
  amount: number,
  tokenMint: string,
) => {
  let transaction = new Transaction();
  try {
    let { tokenName, decimal } = SPL_TOKENS.find(
      (data) => data.tokenMint === tokenMint,
    )!;

    transaction.feePayer = wallet;
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;

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

    return transaction;
  } catch (error) {
    return transaction;
  }
};

export const rollDice = async (
  wallet: WalletContextState,
  amount: number,
  chosenNumbers: number[],
) => {
  try {
    if (!wallet.publicKey) throw new Error("Wallet not connected");

    const res = await fetch(`/api/games/dice/roll`, {
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
      toast.error(message);
      throw new Error(message);
    }

    if (data.result == "Won") toast.success(message, { duration: 2000 });
    else toast.error(message, { duration: 2000 });

    return { success, message, data };
  } catch (error) {
    return { success: false, message: "Unexpected error", data: null };
  }
};

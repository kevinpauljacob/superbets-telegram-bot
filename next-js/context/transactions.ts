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
import { GameType } from "@/utils/provably-fair";
import { errorCustom, successCustom } from "@/components/toasts/ToastGroup";

export const connection = new Connection(process.env.NEXT_PUBLIC_RPC!);

const devPublicKey = new PublicKey(process.env.NEXT_PUBLIC_DEV_PUBLIC_KEY!);

export const fomoToken = "Cx9oLynYgC3RrgXzin7U417hNY9D6YB1eMGw4ZMbWJgw";

export const launchPromoEdge = true;

export interface User {
  wallet: string;
  solAmount: number;
  keys: number;
  stakedAmount: number;
  tier: number;
  multiplier: number;
  points: number;
}

export const formatNumber = (number: number, fractions?: number) => {
  return number?.toLocaleString(undefined, {
    maximumFractionDigits: fractions ?? 3,
  });
};

export const stakingTiers: Record<
  number,
  {
    limit: number;
    multiplier: number;
  }
> = {
  0: {
    limit: 0,
    multiplier: 0.5,
  },
  1: {
    limit: 300,
    multiplier: 1,
  },
  2: {
    limit: 3000,
    multiplier: 1.05,
  },
  3: {
    limit: 15000,
    multiplier: 1.15,
  },
  4: {
    limit: 40000,
    multiplier: 1.3,
  },
  5: {
    limit: 75000,
    multiplier: 1.5,
  },
  6: {
    limit: 150000,
    multiplier: 1.75,
  },
  7: {
    limit: 600000,
    multiplier: 2,
  },
};

export const pointTiers: Record<
  number,
  {
    limit: number;
    label: string;
    text: string;
  }
> = {
  0: {
    limit: 0,
    label: "BRONZE",
    text: "Do you even FOMO bro?",
  },
  1: {
    limit: 5_000,
    label: "SILVER",
    text: "Caught the FOMO bug?",
  },
  2: {
    limit: 25_000,
    label: "GOLD",
    text: "FOMO is rising...",
  },
  3: {
    limit: 100_000,
    label: "PLATINUM",
    text: "On your way to FOMOtopia.",
  },
  4: {
    limit: 250_000,
    label: "ELITE",
    text: "FOMO Jedi - May the gains be with you.",
  },
  5: {
    limit: 500_000,
    label: "SUPREME",
    text: "FOMO Wizard - Spreading magic.",
  },
  6: {
    limit: 750_000,
    label: "LEGENDARY",
    text: "FOMO God – Missing out is for mortals, not you.",
  },
  7: {
    limit: 1_000_000,
    label: "MYTHICAL",
    text: "FOMO is You and You are FOMO.",
  },
};

export const houseEdgeTiers: Record<number, number> = {
  0: 0.01,
  1: 0.009,
  2: 0.0075,
  3: 0.006,
  4: 0.005,
  5: 0.0035,
  6: 0.0015,
  7: 0,
};

export const maxPayouts: Record<GameType, number> = {
  [GameType.dice]: 100,
  [GameType.coin]: 100,
  [GameType.options]: 100,
  [GameType.dice2]: 100,
  [GameType.wheel]: 100,
  [GameType.plinko]: 100,
  [GameType.limbo]: 100,
  [GameType.roulette1]: 100,
  [GameType.roulette2]: 100,
  [GameType.keno]: 100,
  [GameType.mines]: 100,
  [GameType.hilo]: 100,
};

export const obfuscatePubKey = (address: string) => {
  return (
    address?.substring(0, 4) + "..." + address?.substring(address.length - 4)
  );
};

export const translator = (text: string, language: string) => {
  let result = text;
  Object.entries(translationsMap).map((obj, value) => {
    if (
      text &&
      typeof text === "string" &&
      obj[0].toLowerCase() === text?.toLowerCase()
    ) {
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
    errorCustom("Please enter an amount greater than 0");
    return { success: true, message: "Please enter an amount greater than 0" };
  }

  if (!wallet.publicKey) {
    errorCustom("Wallet not connected");
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

    const res = await fetch(`/api/staking/wallet/stake`, {
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
      errorCustom(message);
      throw new Error(message);
    }

    toast.dismiss(toastId);

    successCustom("Stake successfull!");

    return { success: true, message };
  } catch (error) {
    toast.dismiss(toastId);
    errorCustom("Unexpected error!");
    return { success: false, message: error };
  }
};

export const unstakeFOMO = async (
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

    const res = await fetch(`/api/staking/wallet/unstake`, {
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
      errorCustom(message);
      throw new Error(message);
    }

    toast.dismiss(toastId);

    successCustom("Unstake successfull!");

    return { success: true, message };
  } catch (error) {
    toast.dismiss(toastId);

    errorCustom("Unexpected error!");

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

  const vTransactionInstructions = JSON.stringify(
    vTransaction.instructions.filter(
      (i) => !i.programId.equals(ComputeBudgetProgram.programId),
    ),
  );

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
      ComputeBudgetProgram.setComputeUnitLimit({ units: 100_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 400_000 }),
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
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 400_000 }),
      createTransferInstruction(
        userAta,
        devAta,
        wallet,
        Math.floor(amount * Math.pow(10, decimal)),
      ),
    );

    transaction.instructions[2].keys[2].isWritable = true;
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
      ComputeBudgetProgram.setComputeUnitLimit({ units: 100_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 400_000 }),
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
      ComputeBudgetProgram.setComputeUnitLimit({ units: 100_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 400_000 }),
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

  return { transaction, blockhash };
};

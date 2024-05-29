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

export const maintainance = false;

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
    maximumFractionDigits: fractions ?? 4,
    minimumFractionDigits: fractions ?? 4,
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
    label: "BRONZE I",
    text: "Do you even FOMO bro?",
  },
  1: {
    limit: 300,
    label: "BRONZE II",
    text: "Do you even FOMO bro?",
  },
  2: {
    limit: 875,
    label: "BRONZE III",
    text: "Do you even FOMO bro?",
  },
  3: {
    limit: 1500,
    label: "BRONZE IV",
    text: "Do you even FOMO bro?",
  },
  4: {
    limit: 2700,
    label: "BRONZE V",
    text: "Do you even FOMO bro?",
  },
  5: {
    limit: 5000,
    label: "SILVER I",
    text: "Caught the FOMO bug?",
  },
  6: {
    limit: 8000,
    label: "SILVER II",
    text: "Caught the FOMO bug?",
  },
  7: {
    limit: 11500,
    label: "SILVER III",
    text: "Caught the FOMO bug?",
  },
  8: {
    limit: 15500,
    label: "SILVER IV",
    text: "Caught the FOMO bug?",
  },
  9: {
    limit: 20000,
    label: "SILVER V",
    text: "Caught the FOMO bug?",
  },
  10: {
    limit: 25000,
    label: "GOLD I",
    text: "FOMO is rising...",
  },
  11: {
    limit: 32000,
    label: "GOLD II",
    text: "FOMO is rising...",
  },
  12: {
    limit: 44000,
    label: "GOLD III",
    text: "FOMO is rising...",
  },
  13: {
    limit: 60000,
    label: "GOLD IV",
    text: "FOMO is rising...",
  },
  14: {
    limit: 79000,
    label: "GOLD V",
    text: "FOMO is rising...",
  },
  15: {
    limit: 100_000,
    label: "PLATINUM",
    text: "On your way to FOMOtopia.",
  },
  16: {
    limit: 250_000,
    label: "ELITE",
    text: "FOMO Jedi - May the gains be with you.",
  },
  17: {
    limit: 500_000,
    label: "SUPREME",
    text: "FOMO Wizard - Spreading magic.",
  },
  18: {
    limit: 750_000,
    label: "LEGENDARY",
    text: "FOMO God – Missing out is for mortals, not you.",
  },
  19: {
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

type PayoutValue<T> = number;

export const maxPayouts: { [K in GameType]: PayoutValue<K> } = {
  [GameType.dice]: 1,
  [GameType.coin]: 1,
  [GameType.options]: 1,
  [GameType.dice2]: 1,
  [GameType.wheel]: 1,
  [GameType.plinko]: 1,
  [GameType.limbo]: 1,
  [GameType.roulette1]: 1,
  [GameType.roulette2]: 1,
  [GameType.keno]: 1,
  [GameType.mines]: 1,
  [GameType.hilo]: 1,
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
      errorCustom(message);
      throw new Error(message);
    }

    successCustom("Stake successfull!");

    return { success: true, message };
  } catch (error) {
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
      errorCustom(message);
      throw new Error(message);
    }

    successCustom("Unstake successfull!");

    return { success: true, message };
  } catch (error) {
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
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 150_000 }),
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

  return { transaction, blockhash };
};

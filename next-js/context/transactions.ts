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
  createAssociatedTokenAccountIdempotentInstruction,
} from "@solana/spl-token";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { translationsMap } from "@/components/GlobalContext";
import { GameTokens, GameType } from "@/utils/provably-fair";
import {
  errorCustom,
  successCustom,
  warningCustom,
} from "@/components/toasts/ToastGroup";
import { SPL_TOKENS } from "./config";

export const connection = new Connection(process.env.NEXT_PUBLIC_RPC!);

const casinoPublicKey = new PublicKey(
  process.env.NEXT_PUBLIC_CASINO_PUBLIC_KEY!,
);
const stakingPublicKey = new PublicKey(
  process.env.NEXT_PUBLIC_STAKING_PUBLIC_KEY!,
);

export const fomoToken = "Cx9oLynYgC3RrgXzin7U417hNY9D6YB1eMGw4ZMbWJgw";

export const launchPromoEdge = false;

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

export const maxPayouts: {
  [K in GameTokens]: { [K in GameType]: PayoutValue<K> };
} = {
  [GameTokens.SOL]: {
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
  },
  [GameTokens.FOMO]: {
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
  },
  [GameTokens.USDC]: {
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
  },
};

export const commissionLevels: Record<number, number> = {
  0: 25,
  1: 3.5,
  2: 2.5,
  3: 2,
  4: 1,
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
    let { transaction, blockhashWithExpiryBlockHeight } =
      await createDepositTxn(
        wallet.publicKey,
        amount,
        tokenMint,
        stakingPublicKey,
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
        blockhashWithExpiryBlockHeight,
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
    let { transaction, blockhashWithExpiryBlockHeight } =
      await createWithdrawTxn(
        wallet.publicKey!,
        amount,
        tokenMint,
        stakingPublicKey,
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
  devPublicKey: PublicKey,
) => {
  let transaction = new Transaction();
  let { tokenName, decimal } = SPL_TOKENS.find(
    (data) => data.tokenMint === tokenMint,
  )!;

  const blockhashWithExpiryBlockHeight = await connection.getLatestBlockhash();
  transaction.feePayer = wallet;
  transaction.recentBlockhash = blockhashWithExpiryBlockHeight.blockhash;

  transaction.add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 100_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 150_000 }),
  );

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

  transaction.instructions.slice(2).forEach((i) => {
    i.keys.forEach((k) => {
      if (k.pubkey.equals(wallet)) {
        k.isSigner = true;
        k.isWritable = true;
      }
    });
  });

  return { transaction, blockhashWithExpiryBlockHeight };
};

export const createWithdrawTxn = async (
  wallet: PublicKey,
  amount: number,
  tokenMint: string,
  devPublicKey: PublicKey,
) => {
  let transaction = new Transaction();

  let { tokenName, decimal } = SPL_TOKENS.find(
    (data) => data.tokenMint === tokenMint,
  )!;

  transaction.feePayer = wallet;
  const blockhashWithExpiryBlockHeight = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhashWithExpiryBlockHeight.blockhash;

  transaction.add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 100_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 150_000 }),
  );

  if (tokenName === "SOL") {
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: devPublicKey,
        toPubkey: wallet,
        lamports: Math.floor(amount * Math.pow(10, 9)),
      }),
    );
  } else {
    const tokenId = new PublicKey(tokenMint);
    const userAta = await getAssociatedTokenAddress(tokenId, wallet);
    const devAta = await getAssociatedTokenAddress(tokenId, devPublicKey);

    transaction.add(
      createAssociatedTokenAccountIdempotentInstruction(
        wallet,
        userAta,
        wallet,
        tokenId,
      ),
      createTransferInstruction(
        devAta,
        userAta,
        devPublicKey,
        Math.floor(amount * Math.pow(10, decimal)),
      ),
    );
  }

  transaction.instructions.slice(2).forEach((i) => {
    i.keys.forEach((k) => {
      if (k.pubkey.equals(wallet)) {
        k.isSigner = true;
        k.isWritable = true;
      }
    });
  });

  return { transaction, blockhashWithExpiryBlockHeight };
};

export const deposit = async (
  wallet: WalletContextState,
  amount: number,
  tokenMint: string,
  campaignId: any = null,
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
      await createDepositTxn(
        wallet.publicKey,
        amount,
        tokenMint,
        casinoPublicKey,
      );
    console.log("creatin txn with", amount, tokenMint);

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
        campaignId,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const { success, message } = await res.json();

    if (success === false) {
      if (message.includes("limit exceeded"))
        warningCustom(message, "bottom-right", 8000);
      else errorCustom(message);
      throw new Error(message);
    }

    successCustom("Deposit successfull!");

    return { success: true, message };
  } catch (error) {
    // errorCustom("Unexpected error!");
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
      await createWithdrawTxn(
        wallet.publicKey!,
        amount,
        tokenMint,
        casinoPublicKey,
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
        blockhashWithExpiryBlockHeight,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const { success, message } = await res.json();

    if (success === false) {
      if (message.includes("limit exceeded"))
        warningCustom(message, "bottom-right", 8000);
      else errorCustom(message);
      throw new Error(message);
    }

    successCustom("Withdrawal successfull!");

    return { success: true, message };
  } catch (error) {
    // errorCustom("Unexpected error!");

    return { success: true, message: error };
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
    verificationTransaction.instructions.filter(
      (i) => !i.programId.equals(ComputeBudgetProgram.programId),
    ),
  );

  console.log(transactionInstructions, verificationTransactionInstructions);

  return transactionInstructions === verificationTransactionInstructions;
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
        tokenMint: tokenMint,
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
  tokenMint: string,
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
        tokenMint: tokenMint,
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
    // errorCustom("Unexpected error! Please try again.");

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

export const rollDice = async (
  wallet: WalletContextState,
  amount: number,
  tokenMint: string,
  chosenNumbers: number[],
) => {
  try {
    if (!wallet.publicKey) throw new Error("Wallet not connected");

    const res = await fetch(`/api/games/dice`, {
      method: "POST",
      body: JSON.stringify({
        wallet: wallet.publicKey,
        amount: amount,
        tokenMint: tokenMint,
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
  multiplier: number,
  tokenMint: string,
) => {
  try {
    if (!wallet.publicKey) throw new Error("Wallet not connected");

    const res = await fetch(`/api/games/limbo`, {
      method: "POST",
      body: JSON.stringify({
        wallet: wallet.publicKey,
        amount: amount,
        tokenMint: tokenMint,
        multiplier,
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

export const truncateNumber = (num: number, numOfDecimals: number = 4) => {
  const [whole, decimal] = num.toFixed(9).split(".");
  return parseFloat(whole + "." + (decimal || "").slice(0, numOfDecimals));
};

export const isArrayUnique = (arr: number[]) => {
  return new Set(arr).size === arr.length;
};

export const createClaimEarningsTxn = async (
  wallet: PublicKey,
  earnings: Array<{
    tokenMint: string;
    amount: number;
  }>,
  devPublicKey: PublicKey,
) => {
  const transaction = new Transaction();

  transaction.feePayer = wallet;
  const blockhashWithExpiryBlockHeight = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhashWithExpiryBlockHeight.blockhash;

  transaction.add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 100000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 150000 }),
  );

  for (let earning of earnings) {
    let splToken = SPL_TOKENS.find(
      (data) => data.tokenMint === earning.tokenMint,
    );
    if (!splToken) throw new Error("Invalid tokenMint provided!");

    const { tokenName, decimal } = splToken;

    if (tokenName === "SOL") {
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: devPublicKey,
          toPubkey: wallet,
          lamports: Math.floor(earning.amount * Math.pow(10, 9)),
        }),
      );
    } else {
      const tokenId = new PublicKey(earning.tokenMint);
      const userAta = await getAssociatedTokenAddress(tokenId, wallet);
      const devAta = await getAssociatedTokenAddress(tokenId, devPublicKey);

      transaction.add(
        createAssociatedTokenAccountIdempotentInstruction(
          wallet,
          userAta,
          wallet,
          tokenId,
        ),
        createTransferInstruction(
          devAta,
          userAta,
          devPublicKey,
          Math.floor(earning.amount * Math.pow(10, decimal)),
        ),
      );
    }
  }

  transaction.instructions.slice(2).forEach((i) => {
    i.keys.forEach((k) => {
      if (k.pubkey.equals(wallet)) {
        k.isSigner = true;
        k.isWritable = true;
      }
    });
  });

  return { transaction, blockhashWithExpiryBlockHeight };
};

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
import {
  errorCustom,
  successCustom,
  warningCustom,
} from "@/components/toasts/ToastGroup";
import { SPL_TOKENS } from "./config";
import { SessionUser } from "@/components/ConnectWallet";

export const connection = new Connection(process.env.NEXT_PUBLIC_RPC!);

const casinoPublicKey = new PublicKey(
  process.env.NEXT_PUBLIC_CASINO_PUBLIC_KEY!,
);
const stakingPublicKey = new PublicKey(
  process.env.NEXT_PUBLIC_STAKING_PUBLIC_KEY!,
);

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
  return { success: false, message: "Not Allowed" };

  if (amount == 0) {
    errorCustom("Please enter an amount greater than 0");
    return { success: true, message: "Please enter an amount greater than 0" };
  }

  if (!wallet.publicKey) {
    errorCustom("Wallet not connected");
    return { success: true, message: "Wallet not connected" };
  }

  if (tokenMint === "SUPER") {
    errorCustom("Deposit not allowed for this token!");
    return { success: true, message: "Deposit not allowed for this token!" };
  }

  try {
    let { transaction, blockhashWithExpiryBlockHeight } =
      await createDepositTxn(
        wallet?.publicKey!,
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
  return { success: false, message: "Not Allowed" };
  
  if (amount == 0) {
    errorCustom("Please enter an amount greater than 0");
    return { success: true, message: "Please enter an amount greater than 0" };
  }

  if (!wallet.publicKey) {
    errorCustom("Wallet not connected");
    return { success: true, message: "Wallet not connected" };
  }

  if (tokenMint === "SUPER") {
    errorCustom("Withdraw not allowed for this token!");
    return { success: true, message: "Withdraw not allowed for this token!" };
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

  console.log(transactionInstructions);
  console.log(verificationTransactionInstructions);

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
  session: SessionUser | null,
  amount: number,
  tokenMint: string,
  betType: string,
  timeFrame: number,
) => {
  try {
    if (session?.user?.wallet && !wallet.publicKey)
      throw new Error("Wallet not connected");

    if (!session?.user?.isWeb2User && tokenMint === "SUPER")
      throw new Error("You cannot bet with this token!");

    if (betType == null) throw new Error("Invalid bet type");

    const res = await fetch(`/api/games/options`, {
      method: "POST",
      body: JSON.stringify({
        wallet: wallet.publicKey,
        email: session?.user?.email,
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
  session: SessionUser | null,
  amount: number,
  tokenMint: string,
  flipType: string, // heads / tails
) => {
  try {
    if (session?.user?.wallet && !wallet.publicKey)
      throw new Error("Wallet not connected");

    if (!session?.user?.isWeb2User && tokenMint === "SUPER")
      throw new Error("You cannot bet with this token!");

    if (flipType == null) throw new Error("Invalid flip type");

    const res = await fetch(`/api/games/coin`, {
      method: "POST",
      body: JSON.stringify({
        wallet: wallet?.publicKey,
        email: session?.user?.email,
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

export const checkResult = async (
  wallet: WalletContextState,
  session: SessionUser | null,
) => {
  try {
    const res = await fetch(`/api/games/options/checkResult`, {
      method: "POST",
      body: JSON.stringify({
        wallet: wallet.publicKey,
        email: session?.user?.email,
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
  session: SessionUser | null,
  amount: number,
  tokenMint: string,
  chosenNumbers: number[],
) => {
  try {
    if (session?.user?.wallet && !wallet.publicKey)
      throw new Error("Wallet not connected");

    if (!session?.user?.isWeb2User && tokenMint === "SUPER")
      throw new Error("You cannot bet with this token!");

    const res = await fetch(`/api/games/dice`, {
      method: "POST",
      body: JSON.stringify({
        wallet: wallet?.publicKey,
        email: session?.user?.email,
        amount: amount,
        tokenMint: tokenMint,
        chosenNumbers,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const { success, message, data } = await res.json();

    return { success, message, data };
  } catch (error) {
    return { success: false, message: "Unexpected error", data: null };
  }
};

export const limboBet = async (
  wallet: WalletContextState,
  session: SessionUser | null,
  amount: number,
  multiplier: number,
  tokenMint: string,
) => {
  try {
    if (session?.user?.wallet && !wallet.publicKey)
      throw new Error("Wallet not connected");

    if (!session?.user?.isWeb2User && tokenMint === "SUPER")
      throw new Error("You cannot bet with this token!");

    const res = await fetch(`/api/games/limbo`, {
      method: "POST",
      body: JSON.stringify({
        wallet: wallet?.publicKey,
        email: session?.user?.email,
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
  return str
    ? str.substring(0, desiredLength) +
        "..." +
        str.substring(str.length - desiredLength, str.length)
    : "";
}

export const truncateNumber = (num: number, numOfDecimals: number = 4) => {
  const [whole, decimal] = num.toFixed(9).split(".");
  return parseFloat(whole + "." + (decimal || "").slice(0, numOfDecimals));
};

export const isArrayUnique = (arr: number[]) => {
  return new Set(arr).size === arr.length;
};

export const getSolPrice = async (timeInSec: number) => {
  const betEndPrice = await fetch(
    `https://hermes.pyth.network/api/get_price_feed?id=0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d&publish_time=${timeInSec}`,
  )
    .then((res) => res.json())
    .then((data) => {
      const { price } = data;

      if (price.publish_time + 2 < timeInSec)
        throw new Error("Stale price feed!");

      return price.price * Math.pow(10, price.expo);
    });

  return betEndPrice;
};

export const createClaimEarningsTxn = async (
  wallet: PublicKey,
  earnings: Record<string, number>,
) => {
  const transaction = new Transaction();

  transaction.feePayer = wallet;
  const blockhashWithExpiryBlockHeight = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhashWithExpiryBlockHeight.blockhash;

  transaction.add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 100000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 150000 }),
  );

  //sort earnings by key alphabetically
  earnings = Object.fromEntries(
    Object.entries(earnings).sort((a, b) => a[0].localeCompare(b[0])),
  );

  for (let tokenMint in earnings) {
    let splToken = SPL_TOKENS.find((data) => data.tokenMint === tokenMint);
    if (!splToken) throw new Error("Invalid tokenMint provided!");

    const { tokenName, decimal } = splToken;

    if (tokenName === "SOL") {
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: casinoPublicKey,
          toPubkey: wallet,
          lamports: Math.floor(earnings[tokenMint] * Math.pow(10, 9)),
        }),
      );
    } else {
      const tokenId = new PublicKey(tokenMint);
      const userAta = await getAssociatedTokenAddress(tokenId, wallet);
      const devAta = await getAssociatedTokenAddress(tokenId, casinoPublicKey);

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
          casinoPublicKey,
          Math.floor(earnings[tokenMint] * Math.pow(10, decimal)),
        ),
      );
    }
  }

  transaction.instructions.slice(2).forEach((i) => {
    i.keys.forEach((k) => {
      if (k.pubkey.equals(wallet) || k.pubkey.equals(casinoPublicKey)) {
        k.isSigner = true;
        k.isWritable = true;
      }
    });
  });

  return { transaction, blockhashWithExpiryBlockHeight };
};

export const claimEarnings = async (
  wallet: WalletContextState,
  campaigns: Array<{ unclaimedEarnings: Record<string, number> }>,
) => {
  if (!wallet.publicKey) {
    errorCustom("Wallet not connected");
    return { success: true, message: "Wallet not connected" };
  }

  try {
    const earnings: Record<string, number> = {};

    campaigns.forEach((c: { unclaimedEarnings: Record<string, number> }) => {
      Object.entries(c.unclaimedEarnings).forEach(
        ([key, value]: [string, number]) => {
          if (earnings.hasOwnProperty(key)) earnings[key] += value;
          else earnings[key] = value;
        },
      );
    });

    let { transaction, blockhashWithExpiryBlockHeight } =
      await createClaimEarningsTxn(wallet.publicKey, earnings);

    transaction = await wallet.signTransaction!(transaction);
    const transactionBase64 = transaction
      .serialize({ requireAllSignatures: false })
      .toString("base64");

    const res = await fetch(`/api/referral/${wallet.publicKey}/claim`, {
      method: "POST",
      body: JSON.stringify({
        transactionBase64,
        blockhashWithExpiryBlockHeight,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const { success, message } = await res.json();
    if (success) {
      successCustom(message);
    } else errorCustom(message);
    return { success, message };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

import { deposits, wallets } from "..";
import { Deposits, User, WsSignature } from "../models";
import depositFunds from "./depositFunds";
import { createDeposit } from "./transactions";

interface AccountKey {
  pubkey: string;
  writable: boolean;
  signer: boolean;
  source: string;
}

interface Instruction {
  program?: string;
  programId: string;
  parsed?: {
    type: string;
    info: {
      destination: string;
      lamports?: number;
      source?: string;
      tokenAmount?: {
        amount: string;
        decimals: number;
        uiAmount: number;
        uiAmountString: string;
      };
    };
  };
}

interface TokenBalance {
  accountIndex: number;
  mint: string;
  uiTokenAmount: {
    uiAmount: number;
    decimals: number;
    amount: string;
    uiAmountString: string;
  };
  owner: string;
}

interface Transaction {
  transaction: {
    message: {
      accountKeys: AccountKey[];
      instructions: Instruction[];
    };
    signatures: string[];
  };
  meta: {
    preBalances: number[];
    postBalances: number[];
    preTokenBalances: TokenBalance[];
    postTokenBalances: TokenBalance[];
  };
}

export interface Wallets {
  [walletAddress: string]: {
    [tokenMint: string]: string;
  };
}

export interface Deposit {
  token: string;
  amount: number;
  signature: string;
  wallet: string;
}

export const allowedTokens = [
  "SOL",
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
];

const processTransaction = async (result: {
  transaction: Transaction;
  signature: string;
}) => {
  const { transaction, signature } = result;

  try {
    await WsSignature.create({ signature });
  } catch (error: any) {
    if (error.code !== 11000) console.log(signature, error.message);
    return;
  }

  const { message } = transaction.transaction;
  const { accountKeys, instructions } = message;
  const { preBalances, postBalances, preTokenBalances, postTokenBalances } =
    transaction.meta;

  // Check for SOL deposit
  const solTransferInstruction = instructions.find(
    (instruction) =>
      instruction.program === "system" &&
      instruction.programId === "11111111111111111111111111111111" &&
      instruction.parsed?.type === "transfer"
  );

  if (solTransferInstruction && solTransferInstruction.parsed) {
    const { destination, lamports } = solTransferInstruction.parsed.info;

    // Check if the destination exists in the wallets object
    if (!Object.keys(wallets).includes(destination)) {
      let comments = "SOL deposit destination not found in wallets object";
      console.log(comments);
      await createDeposit("SOL", 0, signature, destination, comments, "failed");
      return;
    }

    const destinationIndex = accountKeys.findIndex(
      (account) => account.pubkey === destination
    );

    if (destinationIndex === -1) {
      console.log("SOL deposit destination address not found in accountKeys");
      return;
    }

    const preBalance = preBalances[destinationIndex];
    const postBalance = postBalances[destinationIndex];
    const balanceDiff = postBalance - preBalance - 900000;

    if (balanceDiff <= 0) {
      let comments = "No positive balance change for SOL deposit";
      console.log(comments);
      await createDeposit("SOL", 0, signature, destination, comments, "failed");
      return;
    }

    const solAmount = (postBalance! - 1000000) / 1e9;

    if (solAmount <= 0) {
      let comments = "No positive balance change for SOL deposit";
      console.log(comments);
      await createDeposit("SOL", 0, signature, destination, comments, "failed");
      return;
    }

    console.log("balanceDiff", balanceDiff);
    console.log("SOL deposited:", solAmount);
    console.log("Destination address:", destination);
    console.log("Transaction signature:", signature);
    let player = null;
    player = await User.findOne({
      wallet: destination,
    });
    if (player) {
      const account = player._id;
      await Deposits.create({
        account,
        wallet: destination,
        amount: solAmount,
        type: true,
        tokenMint: "SOL",
        txnSignature: signature,
        status: "pending",
      });
    }
    deposits[signature] = {
      token: "SOL",
      amount: solAmount,
      wallet: destination,
      signature: signature,
    };
    await depositFunds(deposits[signature]);
  }

  // Check for SPL token deposit
  const splTransferInstruction = instructions.find(
    (instruction) =>
      instruction.program === "spl-token" &&
      instruction.parsed?.type === "transferChecked"
  );

  if (splTransferInstruction && splTransferInstruction.parsed) {
    const { destination, tokenAmount } = splTransferInstruction.parsed.info;

    // Find the wallet address for the associated token address
    let walletAddress: string | undefined;
    let tokenMint: string | undefined;

    for (const [wallet, tokens] of Object.entries(wallets)) {
      for (const [mint, associatedAddress] of Object.entries(tokens)) {
        if (associatedAddress === destination) {
          walletAddress = wallet;
          tokenMint = mint;
          break;
        }
      }
      if (walletAddress) break;
    }

    if (!walletAddress || !tokenMint) {
      let comments =
        "SPL token deposit destination not found in wallets object";
      console.log(comments);
      await createDeposit("", 0, signature, "", comments, "failed");
      return;
    }

    if (!allowedTokens.includes(tokenMint)) {
      let comments = "SPL token not in the list of allowed tokens";
      console.log(comments);
      await createDeposit(
        tokenMint,
        0,
        signature,
        walletAddress,
        comments,
        "failed"
      );
      return;
    }

    const postTokenBalance = postTokenBalances.find(
      (balance) =>
        balance.accountIndex ===
        accountKeys.findIndex((key) => key.pubkey === destination)
    );

    if (!postTokenBalance) {
      let comments = "Post token balance not found";
      console.log(comments);
      await createDeposit(
        tokenMint,
        0,
        signature,
        walletAddress,
        comments,
        "failed"
      );
      return;
    }

    const preTokenBalance = preTokenBalances.find(
      (balance) => balance.accountIndex === postTokenBalance.accountIndex
    );

    let tokenAmountDeposited: number;

    if (preTokenBalance) {
      tokenAmountDeposited =
        postTokenBalance.uiTokenAmount.uiAmount -
        preTokenBalance.uiTokenAmount.uiAmount;
    } else {
      tokenAmountDeposited = postTokenBalance.uiTokenAmount.uiAmount;
    }

    if (tokenAmountDeposited <= 0) {
      let comments = "No positive balance change for SPL token deposit";
      console.log(comments);
      await createDeposit(
        tokenMint,
        0,
        signature,
        walletAddress,
        comments,
        "failed"
      );
      return;
    }

    console.log("SPL token deposited:", tokenAmountDeposited);
    console.log("Token mint:", tokenMint);
    console.log("Destination wallet:", walletAddress);
    console.log("Transaction signature:", signature);

    let player = await User.findOne({
      wallet: walletAddress,
    });

    if (player) {
      const account = player._id;
      await Deposits.create({
        account,
        wallet: walletAddress,
        amount: tokenAmountDeposited,
        type: true,
        tokenMint: tokenMint,
        txnSignature: signature,
        status: "pending",
      });
    }

    deposits[signature] = {
      token: tokenMint,
      amount: tokenAmountDeposited,
      wallet: walletAddress,
      signature: signature,
    };
    await depositFunds(deposits[signature]);
    return;
  }

  console.log("No supported deposit instruction found");
};

export default processTransaction;

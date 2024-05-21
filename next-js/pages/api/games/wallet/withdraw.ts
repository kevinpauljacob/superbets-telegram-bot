import {
  BlockhashWithExpiryBlockHeight,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import {
  createWithdrawTxn,
  retryTxn,
  verifyFrontendTransaction,
  timeWeightedAvgInterval,
  timeWeightedAvgLimit,
  isArrayUnique,
} from "../../../../context/gameTransactions";
import connectDatabase from "../../../../utils/database";
import Deposit from "../../../../models/games/deposit";
import User from "../../../../models/games/gameUser";

import { getToken } from "next-auth/jwt";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import TxnSignature from "../../../../models/txnSignature";
import { NextApiRequest, NextApiResponse } from "next";

const secret = process.env.NEXTAUTH_SECRET;

const connection = new Connection(process.env.BACKEND_RPC!, "confirmed");

const devWalletKey = Keypair.fromSecretKey(
  bs58.decode(process.env.DEV_KEYPAIR!),
);

export const config = {
  maxDuration: 60,
};

type InputType = {
  transactionBase64: string;
  wallet: string;
  amount: number;
  tokenMint: string;
  blockhashWithExpiryBlockHeight: BlockhashWithExpiryBlockHeight;
};

type Totals = {
  depositTotal: number;
  withdrawalTotal: number;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let {
        transactionBase64,
        wallet,
        amount,
        tokenMint,
        blockhashWithExpiryBlockHeight,
      }: InputType = req.body;

      const token = await getToken({ req, secret });

      if (!token || !token.sub || token.sub != wallet)
        return res.send({
          error: "User wallet not authenticated",
        });

      await connectDatabase();

      if (
        !wallet ||
        !transactionBase64 ||
        !amount ||
        !tokenMint ||
        tokenMint != "SOL" ||
        !blockhashWithExpiryBlockHeight
      )
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      if (amount <= 0)
        return res
          .status(400)
          .json({ success: false, message: "Invalid withdraw amount !" });

      let user = await User.findOne({ wallet });

      if (!user)
        return res
          .status(400)
          .json({ success: false, message: "User does not exist !" });

      if (
        user.deposit.find((d: any) => d.tokenMint === tokenMint)?.amount <
        amount
      )
        return res
          .status(400)
          .json({ success: false, message: "Insufficient balance !" });

      let { transaction: vTxn } = await createWithdrawTxn(
        new PublicKey(wallet),
        amount,
        tokenMint,
      );

      const txn = Transaction.from(
        Buffer.from(transactionBase64 as string, "base64"),
      );

      if (!verifyFrontendTransaction(txn, vTxn))
        return res
          .status(400)
          .json({ success: false, message: "Transaction verfication failed" });

      // //Check if the time weighted average exceeds the limit
      const userAgg = await Deposit.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(Date.now() - timeWeightedAvgInterval),
            },
          },
        },
        {
          $group: {
            _id: "$wallet",
            depositTotal: {
              $sum: {
                $cond: [{ $eq: ["$type", true] }, "$amount", 0],
              },
            },
            withdrawalTotal: {
              $sum: {
                $cond: [{ $eq: ["$type", false] }, "$amount", 0],
              },
            },
          },
        },
      ]);

      if (userAgg.length == 0)
        return res.status(400).json({
          success: false,
          message: "Unexpected error please retry in 5 mins !",
        });

      const initialTotals: Totals = { depositTotal: 0, withdrawalTotal: 0 };

      const transferAgg = userAgg.reduce<Totals>((acc, current) => {
        acc.depositTotal += current.depositTotal;
        acc.withdrawalTotal += current.withdrawalTotal;
        return acc;
      }, initialTotals);

      let userTransferAgg = userAgg.find((data) => data._id == wallet);

      if (
        userTransferAgg.depositTotal <
        10 * (userTransferAgg.withdrawalTotal + amount)
      ) {
        await Deposit.create({
          wallet,
          amount,
          type: false,
          tokenMint,
          status: "review",
        });

        return res.status(400).json({
          success: false,
          message: "Withdrawal limit exceeded, added to queue for review",
        });
      }

      const netTransfer =
        (transferAgg.withdrawalTotal ?? 0) -
        (transferAgg.depositTotal ?? 0) +
        amount;

      if (netTransfer > timeWeightedAvgLimit) {
        await Deposit.create({
          wallet,
          amount,
          type: false,
          tokenMint,
          status: "review",
        });

        return res.status(400).json({
          success: false,
          message: "Withdrawal limit exceeded, added to queue for review",
        });
      }

      const result = await User.findOneAndUpdate(
        {
          wallet,
          deposit: {
            $elemMatch: {
              tokenMint: tokenMint,
              amount: { $gte: amount },
            },
          },
        },
        {
          $inc: { "deposit.$.amount": -amount },
        },
        { new: true },
      );

      if (!result) {
        throw new Error(
          "Withdraw failed: insufficient funds or user not found",
        );
      }

      txn.partialSign(devWalletKey);

      const txnSignature = await retryTxn(
        connection,
        txn,
        blockhashWithExpiryBlockHeight,
      );

      await TxnSignature.create({ txnSignature });

      await Deposit.create({
        wallet,
        amount,
        type: false,
        tokenMint,
        txnSignature,
      });

      return res.json({
        success: true,
        message: `${amount} SOL successfully withdrawn!`,
      });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  } else
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
}

export default handler;

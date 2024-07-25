import {
  BlockhashWithExpiryBlockHeight,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import {
  timeWeightedAvgInterval,
  timeWeightedAvgLimit,
  userLimitMultiplier,
} from "@/context/config";
import connectDatabase from "../../../../utils/database";
import Deposit from "../../../../models/games/deposit";
import User from "../../../../models/games/gameUser";

import { getToken } from "next-auth/jwt";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import TxnSignature from "../../../../models/txnSignature";
import { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";
import { GameType } from "@/utils/provably-fair";
import { gameModelMap } from "@/models/games";
import { SPL_TOKENS } from "@/context/config";
import {
  createWithdrawTxn,
  retryTxn,
  verifyFrontendTransaction,
} from "@/context/transactions";

const secret = process.env.NEXTAUTH_SECRET;

const connection = new Connection(process.env.BACKEND_RPC!, "confirmed");

const devWalletKey = Keypair.fromSecretKey(
  bs58.decode(process.env.CASINO_KEYPAIR!),
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

const blackListedWallet: any = {
  EkBEqMcFqZeLCEpsyEP6xbE8Y2Fq3dBYxaqs3yJJW55w: {
    amount: 1000,
    date: new Date(1716554434000),
  },
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

      if (tokenMint === "WEB2")
        return res.status(405).json({
          success: false,
          message: "Withdraw not allowed for this token!",
        });

      if (
        !wallet ||
        !transactionBase64 ||
        !amount ||
        !tokenMint ||
        !blockhashWithExpiryBlockHeight
      )
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      if (
        typeof amount !== "number" ||
        !isFinite(amount) ||
        !(amount > 0) ||
        !SPL_TOKENS.some((t) => t.tokenMint === tokenMint)
      )
        return res
          .status(400)
          .json({ success: false, message: "Invalid parameters!" });

      await connectDatabase();

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
        devWalletKey.publicKey,
      );

      const txn = Transaction.from(
        Buffer.from(transactionBase64 as string, "base64"),
      );

      if (!verifyFrontendTransaction(txn, vTxn))
        return res
          .status(400)
          .json({ success: false, message: "Transaction verfication failed" });

      let isPendingWithdraw = await Deposit.findOne({
        wallet,
        status: "review",
      });

      if (isPendingWithdraw)
        return res.status(400).json({
          success: false,
          message:
            "You have a pending withdrawal. Please wait for it to be processed !",
        });

      //Check if the time weighted average exceeds the limit
      const userAgg = await Deposit.aggregate([
        {
          $match: {
            tokenMint,
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

      // if wallet is blacklisted restrict withdrawal till Vol condition met

      if (Object.keys(blackListedWallet).includes(wallet)) {
        const user = await User.findOne({ wallet });
        if (!user)
          return res.json({
            success: true,
            data: [],
            message: "No data found",
          });

        let totalVolume = 0;

        for (const [_, value] of Object.entries(GameType)) {
          const game = value;
          const model = gameModelMap[game as keyof typeof gameModelMap];

          const res = await model.aggregate([
            {
              $match: {
                wallet,
                tokenMint,
                createdAt: { $gt: blackListedWallet[wallet].date },
              },
            },
            {
              $group: {
                _id: null,
                amount: { $sum: "$amount" },
              },
            },
          ]);

          if (res.length > 0) {
            totalVolume += res[0].amount;
          }
        }

        if (totalVolume < blackListedWallet[wallet].amount)
          throw new Error(
            "Withdraw failed ! Insufficient volume for processing withdrawal",
          );
      }

      const result = await User.findOneAndUpdate(
        {
          wallet,
          deposit: {
            $elemMatch: {
              tokenMint,
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

      const route = `https://fomowtf.com/api/games/global/getUserVol?wallet=${wallet}&tokenMint=${tokenMint}`;

      let totalVolume = (await (await fetch(route)).json())?.data ?? 0;

      let userTransferAgg = userAgg.find((data) => data._id == wallet) ?? {
        wallet: wallet,
        withdrawalTotal: 0,
        depositTotal: 0,
      };

      if (
        totalVolume * userLimitMultiplier <
        userTransferAgg.withdrawalTotal + amount
      ) {
        await Deposit.create({
          wallet,
          amount,
          type: false,
          tokenMint,
          txnSignature: uuidv4().toString(),
          comments: "user net transfer exceeded !",
          status: "review",
        });

        return res.status(400).json({
          success: false,
          message: "Withdrawal limit exceeded, added to queue for review",
        });
      }

      const initialTotals: Totals = { depositTotal: 0, withdrawalTotal: 0 };

      const transferAgg = userAgg.reduce<Totals>((acc, current) => {
        acc.depositTotal += current.depositTotal;
        acc.withdrawalTotal += current.withdrawalTotal;
        return acc;
      }, initialTotals);

      const netTransfer =
        (transferAgg.withdrawalTotal ?? 0) -
        (transferAgg.depositTotal ?? 0) +
        amount;

      // disable global

      // netTransfer = 1000000000;

      const tokenName = SPL_TOKENS.find((t) => t.tokenMint === tokenMint)
        ?.tokenName!;

      if (netTransfer > timeWeightedAvgLimit[tokenName]) {
        await Deposit.create({
          wallet,
          amount,
          type: false,
          comments: "global net transfer exceeded !",
          txnSignature: uuidv4().toString(),
          tokenMint,
          status: "review",
        });

        return res.status(400).json({
          success: false,
          message: "Withdrawal limit exceeded, added to queue for review",
        });
      }

      txn.partialSign(devWalletKey);

      let txnSignature;

      try {
        txnSignature = await retryTxn(
          connection,
          txn,
          blockhashWithExpiryBlockHeight,
        );
      } catch (e) {
        // await User.findOneAndUpdate(
        //   {
        //     wallet,
        //     deposit: {
        //       $elemMatch: {
        //         tokenMint: tokenMint,
        //       },
        //     },
        //   },
        //   {
        //     $inc: { "deposit.$.amount": amount },
        //   },
        //   { new: true },
        // );
        return res.json({
          success: false,
          message: `Withdraw failed ! Please retry ... `,
        });
      }

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
        message: `${amount} ${
          SPL_TOKENS.find((token) => token.tokenMint === tokenMint)
            ?.tokenName ?? ""
        } successfully withdrawn!`,
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

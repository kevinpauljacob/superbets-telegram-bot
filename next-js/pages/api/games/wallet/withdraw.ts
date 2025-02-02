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
  verifyTransaction,
} from "@/context/transactions";

/**
 * @swagger
 * /games/wallet/withdraw:
 *   post:
 *     summary: Withdraw funds from a wallet
 *     description: Handles the withdrawal of funds from a specified wallet.
 *     tags:
 *       - Game/Wallet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactionBase64:
 *                 type: string
 *                 description: The base64 encoded transaction.
 *               wallet:
 *                 type: string
 *                 description: The wallet address.
 *               amount:
 *                 type: number
 *                 description: The amount to withdraw.
 *               tokenMint:
 *                 type: string
 *                 description: The mint address of the token.
 *               blockhashWithExpiryBlockHeight:
 *                 type: object
 *                 properties:
 *                   blockhash:
 *                     type: string
 *                     description: The blockhash for the transaction.
 *                   lastValidBlockHeight:
 *                     type: number
 *                     description: The last valid block height for the transaction.
 *     responses:
 *       200:
 *         description: Successfully withdrawn funds.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       405:
 *         description: Method not allowed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *     security:
 *       - API_KEY: []
 */

const secret = process.env.NEXTAUTH_SECRET;

const connection = new Connection(process.env.BACKEND_RPC!, "confirmed");

const devWallet = Keypair.fromSecretKey(
  bs58.decode(process.env.CASINO_KEYPAIR!),
);

export const config = {
  maxDuration: 60,
};

type InputType = {
  email: string;
  depositWallet: string;
  amount: number;
  tokenMint: string;
};

type Totals = {
  depositTotal: number;
  withdrawalTotal: number;
};

const blackListedAccounts: any = {
  EkBEqMcFqZeLCEpsyEP6xbE8Y2Fq3dBYxaqs3yJJW55w: {
    amount: 1000,
    date: new Date(1716554434000),
  },
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let {
        email,
        depositWallet: wallet,
        amount,
        tokenMint,
      }: InputType = req.body;

      if (tokenMint === "SUPER")
        return res.status(405).json({
          success: false,
          message: "Withdraw not allowed for this token!",
        });

      if (!email || !wallet || !amount || !tokenMint)
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

      let user = await User.findOne({ email });

      if (!user)
        return res
          .status(400)
          .json({ success: false, message: "User does not exist !" });

      const account = user._id;

      if (
        user.deposit.find((d: any) => d.tokenMint === tokenMint)?.amount <
        amount
      )
        return res
          .status(400)
          .json({ success: false, message: "Insufficient balance !" });

      let isPendingWithdraw = await Deposit.findOne({
        account,
        status: "review",
      });

      if (isPendingWithdraw)
        return res.status(400).json({
          success: false,
          message:
            "You have a pending withdrawal. Please wait for it to be processed !",
        });

      let { transaction, blockhashWithExpiryBlockHeight } =
        await createWithdrawTxn(
          new PublicKey(wallet),
          amount,
          tokenMint,
          devWallet.publicKey,
        );

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
            _id: "$account",
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

      if (Object.keys(blackListedAccounts).includes(email)) {
        const user = await User.findOne({ email });
        if (!user)
          return res.json({
            success: true,
            data: [],
            message: "No data found",
          });
        const account = user._id;
        let totalVolume = 0;

        for (const [_, value] of Object.entries(GameType)) {
          const game = value;
          const model = gameModelMap[game as keyof typeof gameModelMap];

          const res = await model.aggregate([
            {
              $match: {
                account,
                tokenMint,
                createdAt: { $gt: blackListedAccounts[email].date },
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

        if (totalVolume < blackListedAccounts[email].amount)
          throw new Error(
            "Withdraw failed ! Insufficient volume for processing withdrawal",
          );
      }

      const result = await User.findOneAndUpdate(
        {
          email,
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

      let totalVolume = 0;

      for (const [_, value] of Object.entries(GameType)) {
        const game = value;
        const model = gameModelMap[game as keyof typeof gameModelMap];

        const res = await model.aggregate([
          {
            $match: {
              account,
              tokenMint,
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
      let userTransferAgg = userAgg.find((data) => data._id == account) ?? {
        account: account,
        withdrawalTotal: 0,
        depositTotal: 0,
      };

      if (
        totalVolume * userLimitMultiplier <
        userTransferAgg.withdrawalTotal + amount
      ) {
        await Deposit.create({
          account,
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

      const tokenName = SPL_TOKENS.find(
        (t) => t.tokenMint === tokenMint,
      )?.tokenName!;

      if (netTransfer > timeWeightedAvgLimit[tokenName]) {
        await Deposit.create({
          account,
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
      const signer = Keypair.fromSecretKey(devWallet.secretKey);
      transaction.partialSign(signer);

      const transactionSimulation = await connection.simulateTransaction(
        transaction
      );
      console.log(transactionSimulation.value, transaction);

      let txnSignature;

      try {
        txnSignature = await retryTxn(
          connection,
          transaction,
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
        console.log(e);
        return res.json({
          success: false,
          message: `Withdraw failed ! Please retry ... `,
        });
      }
      await TxnSignature.create({ txnSignature });

      await Deposit.create({
        account,
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

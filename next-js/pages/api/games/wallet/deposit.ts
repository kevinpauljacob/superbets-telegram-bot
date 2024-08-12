import {
  BlockhashWithExpiryBlockHeight,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import connectDatabase from "../../../../utils/database";
import Deposit from "../../../../models/games/deposit";
import User from "../../../../models/games/gameUser";
import TxnSignature from "../../../../models/txnSignature";

import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import Campaign from "@/models/analytics/campaigns";
import { SPL_TOKENS } from "@/context/config";
import {
  createDepositTxn,
  retryTxn,
  verifyTransaction,
} from "@/context/transactions";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";

/**
 * @swagger
 * tags:
 *  name: Game/Wallet
 *  description: Game wallet related endpoints
 */
/**
 * @swagger
 * /api/games/wallet/deposit:
 *   post:
 *     summary: Deposit tokens into a user's wallet
 *     description: Handles depositing tokens into a user's wallet. This endpoint is currently disabled.
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
 *                 description: The user's wallet address.
 *               amount:
 *                 type: number
 *                 description: The deposit amount.
 *               tokenMint:
 *                 type: string
 *                 description: The token mint.
 *               blockhashWithExpiryBlockHeight:
 *                 type: object
 *                 properties:
 *                   blockhash:
 *                     type: string
 *                   lastValidBlockHeight:
 *                     type: number
 *               campaignId:
 *                 type: string
 *                 description: The campaign ID (optional).
 *             required:
 *               - transactionBase64
 *               - wallet
 *               - amount
 *               - tokenMint
 *               - blockhashWithExpiryBlockHeight
 *     responses:
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
 *       400:
 *         description: Bad request.
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
 */

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
  campaignId: string;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  return res
    .status(405)
    .json({ success: false, message: "Method not allowed!" });
  if (req.method === "POST") {
    try {
      let {
        transactionBase64,
        wallet,
        amount,
        tokenMint,
        blockhashWithExpiryBlockHeight,
        campaignId,
      }: InputType = req.body;

      if (tokenMint === "SUPER")
        return res.status(405).json({
          success: false,
          message: "Deposit not allowed for this token!",
        });

      await connectDatabase();

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

      let { transaction: vTxn } = await createDepositTxn(
        new PublicKey(wallet),
        amount,
        tokenMint,
        devWalletKey.publicKey,
      );

      const txn = Transaction.from(
        Buffer.from(transactionBase64 as string, "base64"),
      );

      if (!verifyTransaction(txn, vTxn))
        return res
          .status(400)
          .json({ success: false, message: "Transaction verfication failed" });

      const txnSignature = await retryTxn(
        connection,
        txn,
        blockhashWithExpiryBlockHeight,
      );

      await TxnSignature.create({ txnSignature });

      const user = await User.findOne({ wallet });
      if (!user)
        await User.create({ wallet, deposit: [{ tokenMint, amount }] });
      else {
        await User.findOneAndUpdate(
          {
            wallet,
            "deposit.tokenMint": { $ne: tokenMint },
          },
          {
            $push: { deposit: { tokenMint, amount: 0 } },
          },
        );

        await User.findOneAndUpdate(
          {
            wallet,
            "deposit.tokenMint": tokenMint,
          },
          {
            $inc: { "deposit.$.amount": amount },
          },
        );
      }

      await Deposit.create({
        wallet,
        amount,
        type: true,
        tokenMint,
        txnSignature,
      });

      if (campaignId) {
        try {
          await Campaign.create({
            wallet,
            amount,
            campaignId,
          });
        } catch (e) {
          console.log("unable to create campaign !");
        }
      }
      const tokenName = SPL_TOKENS.find(
        (t) => t.tokenMint === tokenMint,
      )?.tokenName;

      return res.json({
        success: true,
        message: `${amount} ${tokenName} successfully deposited!`,
      });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  } else {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }
}

export default handler;

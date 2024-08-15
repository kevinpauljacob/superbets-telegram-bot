import { Deposit } from "./processTransaction";
import { Deposits, User, TxnSignature } from "../models";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { createDepositTxn, retryTxn } from "./transactions";
import connectDatabase from "./database";
import dotenv from "dotenv";
import { deposits } from "..";

dotenv.config();
const devWallet = process.env.DEV_PUBLIC_KEY!;
export const connection = new Connection(process.env.BACKEND_RPC!, "confirmed");

const depositFunds = async (deposit: Deposit) => {
  const { token, amount, wallet, signature } = deposit;

  //  add checks  ??
  if (!token || !amount || !wallet || !signature) {
    console.log("Missing parameters: ", deposit);
    return;
  }
  await connectDatabase();
  const user = await User.findOne({
    wallet,
  });

  if (!user) {
    console.log("User not found", deposit);
    return;
  }

  const account = user._id;

  try {
    let { transaction, blockhashWithExpiryBlockHeight } =
      await createDepositTxn(
        new PublicKey(wallet),
        user.privateKey,
        user.iv,
        amount,
        token,
        new PublicKey(devWallet)
      );

    const txnSignature = await retryTxn(
      connection,
      transaction,
      blockhashWithExpiryBlockHeight
    );

    await TxnSignature.create({ txnSignature });

    await User.findOneAndUpdate(
      {
        wallet,
        "deposit.tokenMint": { $ne: token },
      },
      {
        $push: { deposit: { tokenMint: token, amount: 0 } },
      }
    );

    await User.findOneAndUpdate(
      {
        wallet,
        "deposit.tokenMint": token,
      },
      {
        $inc: { "deposit.$.amount": amount },
      }
    );

    await Deposits.findOneAndUpdate(
      {
        account,
        txnSignature: signature,
      },
      {
        $set: {
          status: "completed",
        },
      }
    );

    delete deposits[signature];
  } catch (e) {
    console.log("Error: ", e, "for ", deposit);
    await Deposits.findOneAndUpdate(
      {
        account,
        txnSignature: signature,
      },
      {
        $set: {
          status: "failed",
        },
      }
    );
  }
};

export default depositFunds;

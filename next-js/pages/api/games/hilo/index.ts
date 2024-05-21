import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { GameSeed, Hilo, User } from "@/models/games";
import { seedStatus } from "@/utils/provably-fair";
import { minGameAmount } from "@/context/gameTransactions";

const secret = process.env.NEXTAUTH_SECRET;

export const config = {
  maxDuration: 60,
};

type InputType = {
  wallet: string;
  amount: number;
  tokenMint: string;
  startNumber: number;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      return res
        .status(400)
        .json({ success: false, message: "GAME UNDER DEVELOPMENT !" });

      // let { wallet, amount, tokenMint, startNumber }: InputType = req.body;

      // const token = await getToken({ req, secret });

      // if (!token || !token.sub || token.sub != wallet)
      //   return res.status(400).json({
      //     success: false,
      //     message: "User wallet not authenticated",
      //   });

      // if (!wallet || !amount || !tokenMint || !startNumber)
      //   return res
      //     .status(400)
      //     .json({ success: false, message: "Missing parameters" });

      // if (amount < minGameAmount)
      //   return res.status(400).json({
      //     success: false,
      //     message: "Invalid bet amount",
      //   });

      // if (tokenMint !== "SOL" || !(1 <= startNumber && startNumber <= 52))
      //   return res
      //     .status(400)
      //     .json({ success: false, message: "Invalid parameters" });

      // await connectDatabase();

      // let user = await User.findOne({ wallet });

      // if (!user)
      //   return res
      //     .status(400)
      //     .json({ success: false, message: "User does not exist !" });

      // if (
      //   user.deposit.find((d: any) => d.tokenMint === tokenMint)?.amount <
      //   amount
      // )
      //   return res
      //     .status(400)
      //     .json({ success: false, message: "Insufficient balance !" });

      // const activeGameSeed = await GameSeed.findOneAndUpdate(
      //   {
      //     wallet,
      //     status: seedStatus.ACTIVE,
      //   },
      //   {
      //     $inc: {
      //       nonce: 1,
      //     },
      //   },
      //   { new: true },
      // );

      // if (!activeGameSeed) {
      //   throw new Error("Server hash not found!");
      // }

      // const { nonce } = activeGameSeed;

      // let result = "Pending";

      // const userUpdate = await User.findOneAndUpdate(
      //   {
      //     wallet,
      //     deposit: {
      //       $elemMatch: {
      //         tokenMint,
      //         amount: { $gte: amount },
      //       },
      //     },
      //   },
      //   {
      //     $inc: {
      //       "deposit.$.amount": -amount,
      //     },
      //   },
      //   {
      //     new: true,
      //   },
      // );

      // if (!userUpdate) {
      //   throw new Error("Insufficient balance for action!!");
      // }

      // const hiloGame = await Hilo.create({
      //   wallet,
      //   amount,
      //   startNumber,
      //   strikeMultiplier: 1,
      //   result,
      //   tokenMint,
      //   amountWon: 0,
      //   amountLost: 0,
      //   nonce,
      //   gameSeed: activeGameSeed._id,
      // });

      // return res.status(201).json({
      //   success: true,
      //   gameId: hiloGame._id,
      //   message: "Hilo game created",
      // });
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

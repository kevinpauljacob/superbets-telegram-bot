import connectDatabase from "../../../../utils/database";
import { FLIP_TAX } from "../../../../context/config";
import User from "../../../../models/games/user";
import Flip from "../../../../models/games/flip";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { minGameAmount } from "@/context/gameTransactions";

const secret = process.env.NEXTAUTH_SECRET;

export const config = {
  maxDuration: 60,
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, amount, tokenMint, flipType } = req.body;

      const token = await getToken({ req, secret });

      if (!token || !token.sub || token.sub != wallet)
        return res.status(400).json({
          success: false,
          message: "User wallet not authenticated",
        });

      if (amount < minGameAmount)
        return res.status(400).json({
          success: false,
          message: "Invalid bet amount",
        });

      await connectDatabase();

      if (
        !wallet ||
        !amount ||
        tokenMint !== "SOL" ||
        (flipType !== true && flipType !== false)
      )
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

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

      const strikeNumber = Math.floor(Math.random() * 100) + 1;
      let result = "Lost";
      let fAmountWon = 0;
      let fAmountLost = amount;

      if (
        (flipType === true && strikeNumber > 51) ||
        (flipType === false && strikeNumber <= 49)
      ) {
        result = "Won";
        fAmountWon = amount;
        fAmountLost = 0;
      }

      let sns;

      if (!user.sns) {
        sns = (
          await fetch(
            `https://sns-api.bonfida.com/owners/${wallet}/domains`,
          ).then((data) => data.json())
        ).result[0];
        if (sns) sns = sns + ".sol";
      }

      const userUpdate = await User.findOneAndUpdate(
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
          $inc: {
            "deposit.$.amount": -amount + fAmountWon * (1 + (1 - FLIP_TAX)),
          },
          sns,
        },
        {
          new: true,
        },
      );

      if (!userUpdate) {
        throw new Error("Insufficient balance for bet!");
      }

      await Flip.create({
        wallet,
        flipAmount: amount,
        flipType,
        strikeNumber,
        result,
        tokenMint,
        amountWon: fAmountWon,
        amountLost: fAmountLost,
      });

      return res.json({
        success: true,
        data: { strikeNumber, result },
        message: result == "Won" ? "You won !" : "You lost !",
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

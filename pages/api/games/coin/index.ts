import connectDatabase from "../../../../utils/database";
import { FLIP_TAX } from "../../../../context/config";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { minGameAmount } from "@/context/gameTransactions";
import { Coin, ServerHash, User } from "@/models/games";
import { GameType, generateServerSeed, generateGameResult } from "@/utils/vrf";

const secret = process.env.NEXTAUTH_SECRET;

export const config = {
  maxDuration: 60,
};

type InputType = {
  wallet: string;
  amount: number;
  tokenMint: string;
  flipType: "heads" | "tails";
  clientSeed: string;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, amount, tokenMint, flipType, clientSeed }: InputType =
        req.body;

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
        !(flipType === "heads" || flipType === "tails")
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

      const serverHashInfo = await ServerHash.findOneAndUpdate(
        {
          wallet,
          gameType: GameType.coin,
          isValid: true,
        },
        {
          $set: {
            isValid: false,
          },
        },
        { new: true },
      );

      if (!serverHashInfo) {
        throw new Error("Server hash not found!");
      }

      const newServerHash = generateServerSeed();

      await ServerHash.create({
        wallet,
        gameType: GameType.coin,
        serverSeed: newServerHash.serverSeed,
        nonce: serverHashInfo.nonce + 1,
        isValid: true,
      });

      const { serverSeed, nonce } = serverHashInfo;

      const strikeNumber = generateGameResult(
        serverSeed,
        clientSeed,
        nonce,
        GameType.coin,
      );

      let result = "Lost";
      let fAmountWon = 0;
      let fAmountLost = amount;

      if (
        (flipType === "heads" && strikeNumber > 51) ||
        (flipType === "tails" && strikeNumber <= 49)
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

      await Coin.create({
        wallet,
        flipAmount: amount,
        flipType,
        strikeNumber,
        result,
        tokenMint,
        amountWon: fAmountWon,
        amountLost: fAmountLost,
        clientSeed,
        serverSeed,
        nonce,
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

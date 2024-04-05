import connectDatabase from "../../../../utils/database";
import { FLIP_TAX } from "../../../../context/config";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { minGameAmount } from "@/context/gameTransactions";
import { Coin, GameSeed, User } from "@/models/games";
import { GameType, generateGameResult, seedStatus } from "@/utils/vrf";

const secret = process.env.NEXTAUTH_SECRET;

export const config = {
  maxDuration: 60,
};

type InputType = {
  wallet: string;
  amount: number;
  tokenMint: string;
  flipType: "heads" | "tails";
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, amount, tokenMint, flipType }: InputType = req.body;

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

      const activeGameSeed = await GameSeed.findOneAndUpdate(
        {
          wallet,
          status: seedStatus.ACTIVE,
        },
        {
          $inc: {
            nonce: 1,
          },
        },
        { new: true },
      );

      if (!activeGameSeed) {
        throw new Error("Server hash not found!");
      }

      const { serverSeed, clientSeed, nonce } = activeGameSeed;

      const strikeNumber = generateGameResult(
        serverSeed,
        clientSeed,
        nonce,
        GameType.coin,
      ) as number;

      let result = "Lost";
      let amountWon = 0;
      let amountLost = amount;

      if (
        (flipType === "heads" && strikeNumber === 1) ||
        (flipType === "tails" && strikeNumber === 2)
      ) {
        result = "Won";
        amountWon = amount;
        amountLost = 0;
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
            "deposit.$.amount": -amount + amountWon * (1 + (1 - FLIP_TAX)),
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
        amount,
        flipType,
        strikeNumber,
        result,
        tokenMint,
        amountWon,
        amountLost,
        nonce,
        gameSeed: activeGameSeed._id,
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

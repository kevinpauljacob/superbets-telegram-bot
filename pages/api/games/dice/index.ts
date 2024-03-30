import connectDatabase from "../../../../utils/database";
import { ROLL_TAX } from "../../../../context/config";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { minGameAmount } from "@/context/gameTransactions";
import { ServerHash, User, Dice } from "@/models/games";
import { GameType, generateServerSeed, generateGameResult } from "@/utils/vrf";

const secret = process.env.NEXTAUTH_SECRET;

export const config = {
  maxDuration: 60,
};

type InputType = {
  wallet: string;
  amount: number;
  tokenMint: string;
  chosenNumbers: number[];
  clientSeed: string;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, amount, tokenMint, chosenNumbers, clientSeed }: InputType =
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

      if (!wallet || !amount || tokenMint !== "SOL" || !clientSeed)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      //check if all values are unique whole numbers between 1 and 6
      if (
        !(
          chosenNumbers &&
          chosenNumbers.length >= 1 &&
          chosenNumbers.length <= 5 &&
          chosenNumbers.every(
            (v: any) => Number.isInteger(v) && v >= 1 && v <= 6,
          )
        )
      )
        return res
          .status(400)
          .json({ success: false, message: "Invalid chosen numbers" });

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
          gameType: GameType.dice,
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
        gameType: GameType.dice,
        serverSeed: newServerHash.serverSeed,
        nonce: serverHashInfo.nonce + 1,
        isValid: true,
      });

      const { serverSeed, nonce } = serverHashInfo;

      const strikeNumber = generateGameResult(
        serverSeed,
        clientSeed,
        nonce,
        GameType.dice,
      ) as number;

      let result = "Lost";
      let amountWon = 0;
      let amountLost = amount;

      if (chosenNumbers.includes(strikeNumber)) {
        result = "Won";
        amountWon = (amount * 6) / chosenNumbers.length;
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
            "deposit.$.amount": -amount + amountWon * (1 - ROLL_TAX),
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

      await Dice.create({
        wallet,
        rollAmount: amount,
        chosenNumbers,
        strikeNumber,
        result,
        tokenMint,
        amountWon,
        amountLost,
        clientSeed,
        serverSeed,
        nonce,
      });

      return res.json({
        success: true,
        data: {
          strikeNumber,
          result,
          amountWon,
          amountLost,
        },
        message: `${result} ${
          result == "Won"
            ? (amountWon * (1 - ROLL_TAX)).toFixed(4)
            : amountLost.toFixed(4)
        } SOL!`,
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

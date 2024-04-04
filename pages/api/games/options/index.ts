import connectDatabase from "../../../../utils/database";
import { User, Option } from "../../../../models/games";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { minGameAmount } from "@/context/gameTransactions";

const secret = process.env.NEXTAUTH_SECRET;

export const config = {
  maxDuration: 60,
};

type InputType = {
  wallet: string;
  amount: number;
  tokenMint: string;
  betType: "betUp" | "betDown";
  timeFrame: number;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, amount, tokenMint, betType, timeFrame }: InputType =
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

      if (timeFrame != 3 && timeFrame != 4 && timeFrame != 5)
        return res.status(400).json({
          success: false,
          message: "Invalid bet timeframe",
        });

      await connectDatabase();

      console.log(wallet);

      if (
        !wallet ||
        !amount ||
        !tokenMint ||
        betType == null ||
        tokenMint != "SOL" ||
        !(betType === "betUp" || betType === "betDown")
      )
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      let betTime = new Date();
      let betEndTime = new Date(betTime.getTime() + timeFrame * 60 * 1000);

      await new Promise((r) => setTimeout(r, 2000));

      let strikePrice = await fetch(
        `https://hermes.pyth.network/api/get_price_feed?id=0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d&publish_time=${Math.floor(
          betTime.getTime() / 1000,
        )}`,
      )
        .then((res) => res.json())
        .then((data) => data.price.price * Math.pow(10, data.price.expo));

      let user = await User.findOne({ wallet });
      let bet = await Option.findOne({ wallet, result: "Pending" });

      if (!user)
        return res
          .status(400)
          .json({ success: false, message: "User does not exist !" });

      if (bet)
        return res.status(400).json({
          success: false,
          message: "Another bet is active on this account",
        });

      if (
        user.deposit.find((d: any) => d.tokenMint === tokenMint)?.amount <
        amount
      )
        return res
          .status(400)
          .json({ success: false, message: "Insufficient balance !" });

      let sns;

      if (!user.sns) {
        sns = (
          await fetch(
            `https://sns-api.bonfida.com/owners/${wallet}/domains`,
          ).then((data) => data.json())
        ).result[0];
        if (sns) sns = sns + ".sol";
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
          isOptionOngoing: false,
        },
        {
          $inc: { "deposit.$.amount": -amount },
          isOptionOngoing: true,
          sns,
        },
        {
          new: true,
        },
      );

      if (!result) {
        throw new Error("Insufficient balance for bet!");
      }

      await Option.create({
        wallet,
        betTime,
        betEndTime,
        amount,
        betType,
        strikePrice,
        timeFrame: 60 * timeFrame,
        result: "Pending",
        tokenMint,
      });

      return res.json({
        success: true,
        data: { betTime, strikePrice },
        message: `${amount} SOL successfully deposited!`,
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

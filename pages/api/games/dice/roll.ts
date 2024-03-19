import connectDatabase from "../../../../utils/database";
import { ROLL_TAX } from "../../../../context/config";
import User from "../../../../models/games/user";
import Roll from "../../../../models/games/roll";
import House from "../../../../models/games/house";
import { getToken } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET;

export const config = {
  maxDuration: 60,
};

async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    return res.status(200).end();
  }

  if (req.method === "POST") {
    try {
      let { wallet, amount, tokenMint, chosenNumbers } = req.body;

      const token = await getToken({ req, secret });

      if (!token || !token.sub || token.sub != wallet)
        return res.status(400).json({
          success: false,
          message: "User wallet not authenticated",
        });

      if (amount != 0.1 && amount != 0.25 && amount != 0.5)
        return res.status(400).json({
          success: false,
          message: "Invalid bet amount",
        });

      await connectDatabase();

      if (!wallet || !amount || tokenMint !== "SOL")
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      if (
        !(
          chosenNumbers &&
          chosenNumbers.length >= 1 &&
          chosenNumbers.length <= 5 &&
          //check if all values are unique whole numbers between 1 and 6
          chosenNumbers.every(
            (v: any) => Number.isInteger(v) && v >= 1 && v <= 6
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

      const strikeNumber = Math.floor(Math.random() * 6) + 1;
      let result = "Lost";
      let rAmountWon = 0;
      let rAmountLost = amount;

      if (chosenNumbers.includes(strikeNumber)) {
        result = "Won";
        rAmountWon = (amount * 6) / chosenNumbers.length;
        rAmountLost = 0;
      }

      let sns;

      if (!user.sns) {
        sns = (
          await fetch(
            `https://sns-api.bonfida.com/owners/${wallet}/domains`
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
            "deposit.$.amount": -amount + rAmountWon * (1 - ROLL_TAX),
            rTotalVolume: amount,
            rAmountWon: -amount + rAmountWon * (1 - ROLL_TAX),
            rAmountLost,
            rollsWon: result == "Won" ? 1 : 0,
            rollsLost: result == "Lost" ? 1 : 0,
          },
          sns,
        },
        {
          new: true,
        }
      );

      if (!userUpdate) {
        throw new Error("Insufficient balance for bet!");
      }

      await House.findOneAndUpdate(
        {},
        {
          $inc: {
            TotalVolume: amount,
            totalRolls: 1,
            rAmountLost,
            rAmountWon: -amount + rAmountWon * (1 - ROLL_TAX),
            rTaxCollected: rAmountWon * ROLL_TAX,
            rollsWon: result == "Won" ? 1 : 0,
            rollsLost: result == "Lost" ? 1 : 0,
          },
        }
      );

      await Roll.create({
        wallet,
        rollAmount: amount,
        chosenNumbers,
        strikeNumber,
        result,
        tokenMint,
      });

      return res.json({
        success: true,
        data: {
          strikeNumber,
          result,
          amountWon: rAmountWon,
          amountLost: rAmountLost,
        },
        message: `${result} ${
          result == "Won"
            ? (rAmountWon * (1 - ROLL_TAX)).toFixed(4)
            : rAmountLost.toFixed(4)
        } SOL!`,
      });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}

export default handler;

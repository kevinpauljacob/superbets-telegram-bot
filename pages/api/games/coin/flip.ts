import connectDatabase from "../../../../utils/database";
import { FLIP_TAX } from "../../../../context/config";
import User from "../../../../models/games/user";
import Flip from "../../../../models/games/flip";
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
      let { wallet, amount, tokenMint, flipType } = req.body;

      const token = await getToken({ req, secret });

      if (!token || !token.sub || token.sub != wallet)
        return res.status(400).json({
          success: false,
          message: "User wallet not authenticated",
        });

      if (amount != 0.2 && amount != 1 && amount != 2)
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
            "deposit.$.amount": -amount + fAmountWon * (1 + (1 - FLIP_TAX)),
            fTotalVolume: amount,
            fAmountWon: fAmountWon * (1 - FLIP_TAX),
            fAmountLost,
            flipsWon: result == "Won" ? 1 : 0,
            flipsLost: result == "Lost" ? 1 : 0,
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
            fTotalVolume: amount,
            totalFlips: 1,
            fAmountLost,
            fAmountWon: fAmountWon * (1 - FLIP_TAX),
            fTaxCollected: fAmountWon * FLIP_TAX,
            flipsWon: result == "Won" ? 1 : 0,
            flipsLost: result == "Lost" ? 1 : 0,
          },
        }
      );

      await Flip.create({
        wallet,
        flipAmount: amount,
        flipType,
        strikeNumber,
        result,
        tokenMint,
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
  }
}

export default handler;

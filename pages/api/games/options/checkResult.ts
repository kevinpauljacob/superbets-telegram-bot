import connectDatabase from "../../../../utils/database";
import User from "../../../../models/games/user";
import Bet from "../../../../models/games/bet";
import House from "../../../../models/games/house";
import { HOUSE_TAX } from "../../../../context/config";
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
      let { wallet } = req.body;

      // return res.send("Under Maintainance");

      const token = await getToken({ req, secret });

      if (!token || !token.sub || token.sub != wallet)
        return res.send({
          error: "User wallet not authenticated",
        });

      await connectDatabase();

      console.log(wallet);

      if (!wallet)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      let user = await User.findOne({ wallet });

      let bet = await Bet.findOne({ wallet, result: "Pending" });

      if (!user)
        return res
          .status(400)
          .json({ success: false, message: "User does not exist !" });

      if (!bet)
        return res.status(400).json({
          success: false,
          message: "No active bets on this account",
        });

      await new Promise((r) => setTimeout(r, 2000));

      let betEndPrice = await fetch(
        `https://hermes.pyth.network/api/get_price_feed?id=0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d&publish_time=${Math.floor(
          new Date(bet.betEndTime).getTime() / 1000
        )}`
      )
        .then((res) => res.json())
        .then((data) => data.price.price * Math.pow(10, data.price.expo));

      let result = "Pending";
      let amountWon = 0;
      let amountLost = bet.betAmount;

      if (bet.betType) {
        // if betUp
        if (betEndPrice > bet.strikePrice) {
          // bet won
          result = "Won";
          amountWon += bet.betAmount;
          amountLost = 0;
        } else {
          // bet lost
          result = "Lost";
          amountWon = 0;
        }
      } else {
        // if betDown
        if (betEndPrice < bet.strikePrice) {
          // bet won
          result = "Won";
          amountWon += bet.betAmount;
          amountLost = 0;
        } else {
          // bet lost
          result = "Lost";
          amountWon = 0;
        }
      }

      const status = await User.findOneAndUpdate(
        {
          wallet,
          deposit: {
            $elemMatch: {
              tokenMint: "SOL",
            },
          },
          isBetOngoing: true,
        },
        {
          $inc: {
            "deposit.$.amount": amountWon * (1 + (1 - HOUSE_TAX)),
            amountWon: amountWon * (1 - HOUSE_TAX),
            amountLost,
            betsWon: result == "Won" ? 1 : 0,
            betsLost: result == "Lost" ? 1 : 0,
          },
          isBetOngoing: false,
        },
        {
          new: true,
        }
      );

      if (!status) {
        throw new Error("User could not be updated !");
      }

      await Bet.findOneAndUpdate(
        { wallet, result: "Pending" },
        {
          result,
          betEndPrice,
        }
      );
      await House.findOneAndUpdate(
        {},
        {
          $inc: {
            amountLost,
            amountWon: amountWon * (1 - HOUSE_TAX),
            taxCollected: amountWon * HOUSE_TAX,
            betsWon: result == "Won" ? 1 : 0,
            betsLost: result == "Lost" ? 1 : 0,
          },
        }
      );

      return res.json({
        success: true,
        data: { amountWon, amountLost, result },
        message: `${result} ${
          result == "Won"
            ? (amountWon * (1 + (1 - HOUSE_TAX))).toFixed(4)
            : amountLost.toFixed(4)
        } SOL!`,
      });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}

export default handler;

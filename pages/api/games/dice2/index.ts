import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { ServerHash, Dice2, User } from "@/models/games";
import { generateGameResult, generateServerSeed, GameType } from "@/utils/vrf";

const secret = process.env.NEXTAUTH_SECRET;

export const config = {
  maxDuration: 60,
};

type InputType = {
  wallet: string;
  amount: number;
  tokenMint: string;
  chance: number;
  clientSeed: string;
  direction: "over" | "under";
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let {
        wallet,
        amount,
        tokenMint,
        chance,
        direction,
        clientSeed,
      }: InputType = req.body;

      const token = await getToken({ req, secret });

      if (!token || !token.sub || token.sub != wallet)
        return res.status(400).json({
          success: false,
          message: "User wallet not authenticated",
        });

      await connectDatabase();

      if (!wallet || !amount || !tokenMint || !chance || !direction)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      if (
        tokenMint !== "SOL" ||
        !(2 <= chance && chance <= 98) ||
        !(direction === "over" || direction === "under")
      )
        return res
          .status(400)
          .json({ success: false, message: "Invalid parameters" });

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
          gameType: GameType.dice2,
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
        gameType: GameType.dice2,
        serverSeed: newServerHash.serverSeed,
        nonce: serverHashInfo.nonce + 1,
        isValid: true,
      });

      const { serverSeed, nonce } = serverHashInfo;

      const strikeNumber = generateGameResult(
        serverSeed,
        clientSeed,
        nonce,
        GameType.dice2,
      ) as number;

      if (!strikeNumber) throw new Error("Invalid strike number!");

      let result = "Lost";
      let amountWon = 0;
      let amountLost = amount;

      if (
        (direction === "over" && strikeNumber > 100 - chance) ||
        (direction === "under" && strikeNumber < chance)
      ) {
        result = "Won";
        amountWon = amount * (100 / chance - 1);
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
              tokenMint,
              amount: { $gte: amount },
            },
          },
        },
        {
          $inc: {
            "deposit.$.amount": -amount + amountWon,
          },
          sns,
        },
        {
          new: true,
        },
      );

      if (!userUpdate) {
        throw new Error("Insufficient balance for Roll!");
      }

      await Dice2.create({
        wallet,
        amount,
        direction,
        chance,
        strikeNumber,
        result,
        tokenMint,
        amountWon,
        amountLost,
        clientSeed,
        serverSeed,
        nonce,
      });

      return res.status(201).json({
        success: true,
        message:
          result === "Won"
            ? "Congratulations! You won!"
            : "Better luck next time!",
        result,
        strikeNumber,
        amountWon,
        amountLost,
        serverSeed,
        newserverSeedHash: newServerHash.serverSeedHash,
      });
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

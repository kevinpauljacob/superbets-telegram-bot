import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { Hilo, User } from "@/models/games";
import { generateGameResult, GameType } from "@/utils/provably-fair";
import StakingUser from "@/models/staking/user";
import {
  houseEdgeTiers,
  launchPromoEdge,
  pointTiers,
} from "@/context/transactions";
import { wsEndpoint } from "@/context/config";
import { Decimal } from "decimal.js";
Decimal.set({ precision: 9 });

const secret = process.env.NEXTAUTH_SECRET;

export const config = {
  maxDuration: 60,
};

type InputType = {
  wallet: string;
  gameId: string;
  userBet: "Higher" | "Lower";
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      return res
        .status(400)
        .json({ success: false, message: "GAME UNDER DEVELOPMENT !" });
      // let { wallet, gameId, userBet }: InputType = req.body;

      // const token = await getToken({ req, secret });

      // if (!token || !token.sub || token.sub != wallet)
      //   return res.status(400).json({
      //     success: false,
      //     message: "User wallet not authenticated",
      //   });

      // await connectDatabase();

      // if (!wallet || !gameId || !userBet)
      //   return res
      //     .status(400)
      //     .json({ success: false, message: "Missing parameters" });

      // if (!["Higher", "Lower"].includes(userBet))
      //   return res
      //     .status(400)
      //     .json({ success: false, message: "Invalid parameters" });

      // let user = await User.findOne({ wallet });

      // if (!user)
      //   return res
      //     .status(400)
      //     .json({ success: false, message: "User does not exist !" });

      // let gameInfo = await Hilo.findOne({
      //   _id: gameId,
      //   result: "Pending",
      // }).populate("gameSeed");
      // if (!gameInfo)
      //   return res
      //     .status(400)
      //     .json({ success: false, message: "Game does not exist !" });

      // let {
      //   nonce,
      //   gameSeed,
      //   userBets,
      //   startNumber,
      //   amount,
      //   amountWon,
      //   strikeMultiplier,
      // } = gameInfo;

      // const strikeNumbers = generateGameResult(
      //   gameSeed.serverSeed,
      //   gameSeed.clientSeed,
      //   nonce,
      //   GameType.hilo,
      //   startNumber,
      // );

      // let result = "Pending";
      // const currentIndex = userBets.length + 1;

      // const userData = await StakingUser.findOneAndUpdate(
      //   { wallet },
      //   {},
      //   { upsert: true, new: true },
      // );
      // const userTier = userData?.tier ?? 0;
      // const houseEdge = launchPromoEdge ? 0 : houseEdgeTiers[userTier];

      // let winChance = 0;
      // for (let i = 1; i <= 52; ++i) {
      //   if (strikeNumbers.slice(0, currentIndex).includes(i)) continue;

      //   if (
      //     (userBet === "Higher" &&
      //       i % 13 >= strikeNumbers[currentIndex - 1] % 13) ||
      //     (userBet === "Lower" &&
      //       i % 13 <= strikeNumbers[currentIndex - 1] % 13)
      //   )
      //     winChance++;
      // }

      // strikeMultiplier = Decimal.mul(strikeMultiplier, 52 - currentIndex)
      //   .div(winChance)
      //   .toNumber();

      // let record;
      // if (
      //   !(
      //     (userBet === "Higher" &&
      //       strikeNumbers[currentIndex] % 13 >=
      //         strikeNumbers[currentIndex - 1] % 13) ||
      //     (userBet === "Lower" &&
      //       strikeNumbers[currentIndex] % 13 <=
      //         strikeNumbers[currentIndex - 1] % 13)
      //   )
      // ) {
      //   result = "Lost";

      //   record = await Hilo.findOneAndUpdate(
      //     {
      //       _id: gameId,
      //       result: "Pending",
      //     },
      //     {
      //       result,
      //       user,
      //       strikeNumbers,
      //       strikeMultiplier,
      //       amountWon: 0,
      //       amountLost: gameInfo.amount,
      //       $push: {
      //         userBets: userBet,
      //       },
      //     },
      //     {
      //       new: true,
      //     },
      //   ).populate("gameSeed");
      // } else {
      //   amountWon = Decimal.mul(
      //     Math.max(amount, amountWon),
      //     strikeMultiplier,
      //   ).toNumber();

      //   if (currentIndex + 1 === 52) {
      //     amountWon = Decimal.mul(
      //       amountWon,
      //       Decimal.sub(1, houseEdge),
      //     ).toNumber();

      //     result = "Won";

      //     const userUpdate = await User.findOneAndUpdate(
      //       {
      //         wallet,
      //         deposit: {
      //           $elemMatch: {
      //             tokenMint: "SOL",
      //           },
      //         },
      //       },
      //       {
      //         $inc: {
      //           "deposit.$.amount": amountWon,
      //           numOfGamesPlayed: 1,
      //         },
      //       },
      //       {
      //         new: true,
      //       },
      //     );

      //     if (!userUpdate) {
      //       throw new Error("Insufficient balance for action!!");
      //     }

      //     record = await Hilo.findOneAndUpdate(
      //       {
      //         _id: gameId,
      //         result: "Pending",
      //       },
      //       {
      //         result,
      //         amountWon,
      //         strikeMultiplier,
      //         houseEdge,
      //         $push: {
      //           userBets: userBet,
      //         },
      //       },
      //       {
      //         new: true,
      //       },
      //     ).populate("gameSeed");
      //   } else {
      //     await Hilo.findOneAndUpdate(
      //       {
      //         _id: gameId,
      //         result: "Pending",
      //       },
      //       {
      //         amountWon,
      //         strikeMultiplier,
      //         $push: {
      //           userBets: userBet,
      //         },
      //       },
      //     );
      //   }
      // }

      // if (result !== "Pending") {
      //   const pointsGained =
      //     0 * user.numOfGamesPlayed + 1.4 * amount * userData.multiplier;

      //   const points = userData.points + pointsGained;
      //   const newTier = Object.entries(pointTiers).reduce((prev, next) => {
      //     return points >= next[1]?.limit ? next : prev;
      //   })[0];

      //   await StakingUser.findOneAndUpdate(
      //     {
      //       wallet,
      //     },
      //     {
      //       $inc: {
      //         points: pointsGained,
      //       },
      //       $set: {
      //         tier: newTier,
      //       },
      //     },
      //   );

      //   const { gameSeed, ...rest } = record.toObject();
      //   rest.game = GameType.hilo;
      //   rest.userTier = parseInt(newTier);
      //   rest.gameSeed = { ...gameSeed, serverSeed: undefined };

      //   const payload = rest;

      //   const socket = new WebSocket(wsEndpoint);

      //   socket.onopen = () => {
      //     socket.send(
      //       JSON.stringify({
      //         clientType: "api-client",
      //         channel: "fomo-casino_games-channel",
      //         authKey: process.env.FOMO_CHANNEL_AUTH_KEY!,
      //         payload,
      //       }),
      //     );

      //     socket.close();
      //   };
      // }

      // return res.status(201).json({
      //   success: true,
      //   message:
      //     result === "Won"
      //       ? "Congratulations! You won!"
      //       : result === "Lost"
      //       ? "Better luck next time!"
      //       : "Game in progress",
      //   result,
      //   strikeNumber: strikeNumbers[currentIndex],
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

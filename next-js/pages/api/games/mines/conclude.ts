import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { Mines, User } from "@/models/games";
import {
  generateGameResult,
  GameType,
  decryptServerSeed,
} from "@/utils/provably-fair";
import StakingUser from "@/models/staking/user";
import {
  houseEdgeTiers,
  launchPromoEdge,
  pointTiers,
  stakingTiers,
} from "@/context/transactions";
import { wsEndpoint } from "@/context/gameTransactions";
import { Decimal } from "decimal.js";
import { SPL_TOKENS } from "@/context/config";
import updateGameStats from "../global/updateGameStats";
Decimal.set({ precision: 9 });

const secret = process.env.NEXTAUTH_SECRET;
const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");

export const config = {
  maxDuration: 60,
};

type InputType = {
  wallet: string;
  gameId: string;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, gameId }: InputType = req.body;

      const token = await getToken({ req, secret });

      if (!token || !token.sub || token.sub != wallet)
        return res.status(400).json({
          success: false,
          message: "User wallet not authenticated",
        });

      await connectDatabase();

      if (!wallet || !gameId)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      let gameInfo = await Mines.findOne({
        _id: gameId,
        result: "Pending",
        wallet,
      }).populate("gameSeed");

      if (!gameInfo)
        return res
          .status(400)
          .json({ success: false, message: "Game does not exist !" });

      let {
        nonce,
        gameSeed,
        minesCount,
        amount,
        amountWon,
        userBets,
        strikeMultiplier,
        tokenMint,
        houseEdge
      } = gameInfo;

      if (userBets.length === 0)
        return res
          .status(400)
          .json({ success: false, message: "No bets placed" });

      const userData = await StakingUser.findOneAndUpdate(
        { wallet },
        {},
        { upsert: true, new: true },
      );

      const { serverSeed: encryptedServerSeed, clientSeed, iv } = gameSeed;

      const serverSeed = decryptServerSeed(
        encryptedServerSeed,
        encryptionKey,
        Buffer.from(iv, "hex"),
      );

      const strikeNumbers = generateGameResult(
        serverSeed,
        clientSeed,
        nonce,
        GameType.mines,
        minesCount,
      );

      const result = amountWon > amount ? "Won" : "Lost";
      const record = await Mines.findOneAndUpdate(
        {
          _id: gameId,
          result: "Pending",
          wallet,
        },
        {
          result,
          $set: { strikeNumbers },
        },
        { new: true },
      ).populate("gameSeed");

      if (!record)
        return res
          .status(400)
          .json({ success: false, message: "Game already concluded!" });

      const feeGenerated = Decimal.mul(amount, strikeMultiplier)
        .mul(houseEdge)
        .toNumber();

      await updateGameStats(GameType.mines, tokenMint, 0, false, feeGenerated);

      const user = await User.findOneAndUpdate(
        {
          wallet,
          deposit: {
            $elemMatch: {
              tokenMint,
            },
          },
        },
        {
          $inc: {
            "deposit.$.amount": amountWon,
          },
        },
        { new: true },
      );

      const pointsGained =
        0 * user.numOfGamesPlayed + 1.4 * amount * userData.multiplier;

      const points = userData.points + pointsGained;
      const newTier = Object.entries(pointTiers).reduce((prev, next) => {
        return points >= next[1]?.limit ? next : prev;
      })[0];

      await StakingUser.findOneAndUpdate(
        {
          wallet,
        },
        {
          $inc: {
            points: pointsGained,
          },
        },
      );

      const { gameSeed: savedGS, ...rest } = record.toObject();
      rest.game = GameType.mines;
      rest.userTier = parseInt(newTier);
      rest.gameSeed = { ...savedGS, serverSeed: undefined };

      const payload = rest;

      const socket = new WebSocket(wsEndpoint);

      socket.onopen = () => {
        socket.send(
          JSON.stringify({
            clientType: "api-client",
            channel: "fomo-casino_games-channel",
            authKey: process.env.FOMO_CHANNEL_AUTH_KEY!,
            payload,
          }),
        );

        socket.close();
      };

      return res.status(201).json({
        success: true,
        message: "Congratulations! You won!",
        amountWon,
        strikeNumbers,
        pointsGained: userBets.length,
        strikeMultiplier,
        result,
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

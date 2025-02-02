import { maintainance, wsEndpoint } from "@/context/config";
import { GameSeed, Mines, User } from "@/models/games";
import connectDatabase from "@/utils/database";
import {
  GameType,
  decryptServerSeed,
  generateGameResult,
} from "@/utils/provably-fair";
import { Decimal } from "decimal.js";
import { NextApiRequest, NextApiResponse } from "next";
import updateGameStats from "../../../../utils/updateGameStats";
Decimal.set({ precision: 9 });

/**
 * @swagger
 * /games/mines/conclude:
 *   post:
 *     summary: Conclude a mines game
 *     description: Concludes a mines game by providing the wallet or email and the game ID.
 *     tags:
 *       - Games
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               wallet:
 *                 type: string
 *                 description: The user's wallet address.
 *               email:
 *                 type: string
 *                 description: The user's email address.
 *               gameId:
 *                 type: string
 *                 description: The game ID.
 *             required:
 *               - wallet
 *               - email
 *               - gameId
 *     responses:
 *       201:
 *         description: Game concluded successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 amountWon:
 *                   type: number
 *                 strikeNumbers:
 *                   type: array
 *                   items:
 *                     type: number
 *                 pointsGained:
 *                   type: number
 *                 strikeMultiplier:
 *                   type: number
 *                 result:
 *                   type: string
 *       400:
 *         description: User does not exist, missing parameters, or other client errors.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *     security:
 *       - API_KEY: []
 */

const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");

export const config = {
  maxDuration: 60,
};

type InputType = {
  wallet: string;
  email: string;
  gameId: string;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, email, gameId }: InputType = req.body;

      if (maintainance)
        return res.status(400).json({
          success: false,
          message: "Under maintenance",
        });

      await connectDatabase();

      if ((!wallet && !email) || !gameId)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      let user = null;
      if (wallet) {
        user = await User.findOne({
          wallet: wallet,
        });
      } else if (email) {
        user = await User.findOne({
          email: email,
        });
      }

      if (!user)
        return res
          .status(400)
          .json({ success: false, message: "User does not exist!" });

      const account = user._id;

      let gameInfo = await Mines.findOne({
        _id: gameId,
        result: "Pending",
        account,
      }).populate("gameSeed");

      if (!gameInfo)
        return res
          .status(400)
          .json({ success: false, message: "Game does not exist!" });

      let {
        nonce,
        gameSeed,
        minesCount,
        amount,
        amountWon,
        userBets,
        strikeMultiplier,
        tokenMint,
        houseEdge,
      } = gameInfo;

      if (userBets.length === 0)
        return res
          .status(400)
          .json({ success: false, message: "No bets placed" });

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
      const amountLost = Math.max(Decimal.sub(amount, amountWon).toNumber(), 0);

      const record = await Mines.findOneAndUpdate(
        {
          _id: gameId,
          result: "Pending",
          account,
        },
        {
          result,
          $set: { strikeNumbers, amountLost },
        },
        { new: true },
      ).populate("gameSeed");

      if (!record)
        return res
          .status(400)
          .json({ success: false, message: "Game already concluded!" });

      await GameSeed.findOneAndUpdate(
        {
          _id: record.gameSeed._id,
          pendingMines: true,
        },
        {
          $set: {
            pendingMines: false,
          },
        },
      );

      const feeGenerated = Decimal.mul(amount, strikeMultiplier)
        .mul(houseEdge)
        .toNumber();

      await updateGameStats(
        account,
        GameType.mines,
        tokenMint,
        0,
        false,
        feeGenerated,
      );

      const userUpdate = await User.findOneAndUpdate(
        {
          _id: account,
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

      const { gameSeed: savedGS, ...rest } = record.toObject();
      rest.game = GameType.mines;
      rest.userTier = 0;
      rest.gameSeed = {
        ...savedGS,
        serverSeed: undefined,
        _id: undefined,
        iv: undefined,
        pendingMines: undefined,
        __v: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      };

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
        message: "Congratulations! You won",
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

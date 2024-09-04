import {
  houseEdgeTiers,
  launchPromoEdge,
  maintainance,
  maxPayouts,
  minAmtFactor,
  SPL_TOKENS,
  stakingTiers,
  wsEndpoint,
} from "@/context/config";
import { GameSeed, Limbo, User } from "@/models/games";
import connectDatabase from "@/utils/database";
import {
  decryptServerSeed,
  GameTokens,
  GameType,
  generateGameResult,
  seedStatus,
} from "@/utils/provably-fair";
import { Decimal } from "decimal.js";
import { NextApiRequest, NextApiResponse } from "next";
import updateGameStats from "../../../../utils/updateGameStats";
Decimal.set({ precision: 9 });

/**
 * @swagger
 * /games/limbo:
 *   post:
 *     summary: Play a limbo game
 *     description: This endpoint allows a user to play a limbo game by betting a certain amount of tokens and choosing a multiplier. The game result is determined in a provably fair manner.
 *     tags:
 *      - Games
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               wallet:
 *                 type: string
 *                 description: The wallet address of the user.
 *               email:
 *                 type: string
 *                 description: The email of the user.
 *               amount:
 *                 type: number
 *                 description: The amount of tokens to bet.
 *               tokenMint:
 *                 type: string
 *                 description: The token mint of the token being bet.
 *               multiplier:
 *                 type: number
 *                 description: The multiplier chosen for the bet, between 1.02 and 50.
 *     responses:
 *       201:
 *         description: Game played successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 result:
 *                   type: string
 *                   enum: [Won, Lost]
 *                 strikeNumber:
 *                   type: number
 *                 strikeMultiplier:
 *                   type: number
 *                 amountWon:
 *                   type: number
 *                 amountLost:
 *                   type: number
 *       400:
 *         description: Bad request
 *       405:
 *         description: Method not allowed
 *       500:
 *         description: Internal server error
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
  amount: number;
  tokenMint: GameTokens;
  multiplier: number;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, email, amount, tokenMint, multiplier }: InputType =
        req.body;

      if (maintainance)
        return res.status(400).json({
          success: false,
          message: "Under maintenance",
        });

      const minGameAmount =
        maxPayouts[tokenMint][GameType.limbo] * minAmtFactor;

      if ((!wallet && !email) || !amount || !tokenMint || !multiplier)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      const splToken = SPL_TOKENS.find((t) => t.tokenMint === tokenMint);
      if (
        typeof amount !== "number" ||
        !isFinite(amount) ||
        !splToken ||
        !(1.02 <= multiplier && multiplier <= 50)
      )
        return res
          .status(400)
          .json({ success: false, message: "Invalid parameters" });

      if (amount < minGameAmount)
        return res.status(400).json({
          success: false,
          message: "Invalid bet amount",
        });

      const strikeMultiplier = multiplier;
      const maxPayout = new Decimal(maxPayouts[tokenMint].limbo);

      const isSuperToken = tokenMint === "SUPER";
      if (!isSuperToken && amount > maxPayout.toNumber())
        return res.status(400).json({
          success: false,
          message: "Bet amount exceeds max payout!",
        });

      await connectDatabase();

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

      if (!user.isWeb2User && isSuperToken)
        return res
          .status(400)
          .json({ success: false, message: "You cannot bet with this token!" });

      if (
        user.deposit.find((d: any) => d.tokenMint === tokenMint)?.amount <
        amount
      )
        return res
          .status(400)
          .json({ success: false, message: "Insufficient balance for bet!" });

      const account = user._id;

      const stakeAmount = 0;
      const stakingTier = Object.entries(stakingTiers).reduce((prev, next) => {
        return stakeAmount >= next[1]?.limit ? next : prev;
      })[0];
      const houseEdge = launchPromoEdge
        ? 0
        : houseEdgeTiers[parseInt(stakingTier)];

      const activeGameSeed = await GameSeed.findOneAndUpdate(
        {
          account,
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

      const {
        serverSeed: encryptedServerSeed,
        clientSeed,
        nonce,
        iv,
      } = activeGameSeed;
      const serverSeed = decryptServerSeed(
        encryptedServerSeed,
        encryptionKey,
        Buffer.from(iv, "hex"),
      );

      const strikeNumber = generateGameResult(
        serverSeed,
        clientSeed,
        nonce,
        GameType.limbo,
      );

      if (!strikeNumber) throw new Error("Invalid strike number!");

      let result = "Lost";
      let amountWon = new Decimal(0);
      let amountLost = amount;
      let feeGenerated = 0;

      const chance = new Decimal(100).div(strikeMultiplier).toNumber();

      if (strikeMultiplier <= strikeNumber) {
        result = "Won";
        amountWon = Decimal.min(
          Decimal.mul(amount, strikeMultiplier),
          tokenMint === "SUPER"
            ? Decimal.mul(amount, strikeMultiplier)
            : maxPayout,
        ).mul(Decimal.sub(1, houseEdge));
        amountLost = Math.max(new Decimal(amount).sub(amountWon).toNumber(), 0);

        feeGenerated = Decimal.min(
          Decimal.mul(amount, strikeMultiplier),
          tokenMint === "SUPER"
            ? Decimal.mul(amount, strikeMultiplier)
            : maxPayout,
        )
          .mul(houseEdge)
          .toNumber();
      }

      const addGame = !user.gamesPlayed.includes(GameType.limbo);

      const userUpdate = await User.findOneAndUpdate(
        {
          _id: account,
          deposit: {
            $elemMatch: {
              tokenMint,
              amount: { $gte: amount },
            },
          },
        },
        {
          $inc: {
            "deposit.$.amount": amountWon.sub(amount),
            numOfGamesPlayed: 1,
          },
          ...(addGame ? { $addToSet: { gamesPlayed: GameType.limbo } } : {}),
          $set: {
            isWeb2User: tokenMint === "SUPER",
          },
        },
        {
          new: true,
        },
      );

      if (!userUpdate) {
        throw new Error("Insufficient balance for bet!");
      }

      const limbo = new Limbo({
        account,
        amount,
        chance,
        strikeNumber,
        strikeMultiplier,
        result,
        tokenMint,
        houseEdge,
        amountWon,
        amountLost,
        nonce,
        gameSeed: activeGameSeed._id,
      });
      await limbo.save();

      await updateGameStats(
        account,
        GameType.limbo,
        tokenMint,
        amount,
        addGame,
        feeGenerated,
      );

      const record = await Limbo.populate(limbo, "gameSeed");
      const { gameSeed, ...rest } = record.toObject();
      rest.game = GameType.limbo;
      rest.userTier = 0;
      rest.gameSeed = {
        ...gameSeed,
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
        message:
          result === "Won"
            ? "Congratulations! You won"
            : "Better luck next time!",
        result,
        strikeNumber,
        amountWon: amountWon.toNumber(),
        amountLost,
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

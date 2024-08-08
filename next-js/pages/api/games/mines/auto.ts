import {
  SPL_TOKENS,
  houseEdgeTiers,
  launchPromoEdge,
  maintainance,
  maxPayouts,
  minAmtFactor,
  stakingTiers,
  wsEndpoint,
} from "@/context/config";
import { isArrayUnique } from "@/context/transactions";
import { GameSeed, Mines, User } from "@/models/games";
import connectDatabase from "@/utils/database";
import {
  GameTokens,
  GameType,
  decryptServerSeed,
  generateGameResult,
  seedStatus,
} from "@/utils/provably-fair";
import Decimal from "decimal.js";
import { NextApiRequest, NextApiResponse } from "next";
import updateGameStats from "../../../../utils/updateGameStats";

/**
 * @swagger
 * /api/games/mines/auto:
 *   post:
 *     summary: Automatically conclude a Mines game
 *     description: Concludes a Mines game automatically by providing wallet or email, bet amount, token mint, number of mines, and user bets.
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
 *               amount:
 *                 type: number
 *                 description: The bet amount.
 *               tokenMint:
 *                 type: string
 *                 description: The token mint.
 *               minesCount:
 *                 type: number
 *                 description: The number of mines.
 *               userBets:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: The user's bets.
 *             required:
 *               - wallet
 *               - email
 *               - amount
 *               - tokenMint
 *               - minesCount
 *               - userBets
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
 *                 result:
 *                   type: string
 *                 amountWon:
 *                   type: number
 *                 strikeNumbers:
 *                   type: array
 *                   items:
 *                     type: number
 *                 strikeMultiplier:
 *                   type: number
 *                 pointsGained:
 *                   type: number
 *                 message:
 *                   type: string
 *       400:
 *         description: User does not exist, missing parameters, invalid parameters, or other client errors.
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
  minesCount: number;
  userBets: Array<number>;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let {
        wallet,
        email,
        amount,
        tokenMint,
        minesCount,
        userBets,
      }: InputType = req.body;

      if (maintainance)
        return res.status(400).json({
          success: false,
          message: "Under maintenance",
        });

      const minGameAmount =
        maxPayouts[tokenMint][GameType.mines] * minAmtFactor;

      if (
        (!wallet && !email) ||
        !amount ||
        !tokenMint ||
        !minesCount ||
        !userBets
      )
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      const splToken = SPL_TOKENS.find((t) => t.tokenMint === tokenMint);
      if (
        typeof amount !== "number" ||
        !isFinite(amount) ||
        !splToken ||
        !(
          Number.isInteger(minesCount) &&
          1 <= minesCount &&
          minesCount <= 24
        ) ||
        !(userBets.length > 0 && userBets.length <= 25 - minesCount) ||
        !userBets.every(
          (bet: number) => Number.isInteger(bet) && 0 <= bet && bet <= 24,
        ) ||
        !isArrayUnique(userBets)
      )
        return res
          .status(400)
          .json({ success: false, message: "Invalid parameters" });

      if (amount < minGameAmount)
        return res.status(400).json({
          success: false,
          message: "Invalid bet amount",
        });

      const maxStrikeMultiplier = 25;
      const maxPayout = new Decimal(maxPayouts[tokenMint].mines);

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

      if (!user.isWeb2User && tokenMint === "SUPER")
        return res
          .status(400)
          .json({ success: false, message: "You cannot bet with this token!" });

      const account = user._id;

      const userUpdate = await User.findOneAndUpdate(
        {
          account,
          deposit: {
            $elemMatch: {
              tokenMint,
              amount: { $gte: amount },
            },
          },
        },
        {
          $inc: {
            "deposit.$.amount": -amount,
            numOfGamesPlayed: 1,
          },
        },
        {
          new: true,
        },
      );

      if (!userUpdate) {
        throw new Error("Insufficient balance for bet!");
      }

      const activeGameSeed = await GameSeed.findOneAndUpdate(
        {
          account,
          status: seedStatus.ACTIVE,
          pendingMines: false,
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

      const strikeNumbers = generateGameResult(
        serverSeed,
        clientSeed,
        nonce,
        GameType.mines,
        minesCount,
      );

      let result = userBets.some((bet) => strikeNumbers.at(bet) === 1)
        ? "Lost"
        : "Won";

      const numBets = userBets.length;

      const stakeAmount = 0;
      const stakingTier = Object.entries(stakingTiers).reduce((prev, next) => {
        return stakeAmount >= next[1]?.limit ? next : prev;
      })[0];
      const houseEdge = launchPromoEdge
        ? 0
        : houseEdgeTiers[parseInt(stakingTier)];

      let strikeMultiplier = 0,
        amountWon = 0,
        amountLost = amount,
        feeGenerated = 0;

      const addGame = !user.gamesPlayed.includes(GameType.mines);

      if (result === "Won") {
        strikeMultiplier = 1;

        for (let i = 0; i < numBets; i++)
          strikeMultiplier = Decimal.div(25 - i, 25 - i - minesCount)
            .mul(strikeMultiplier)
            .toNumber();
        strikeMultiplier = Math.min(strikeMultiplier, maxStrikeMultiplier);

        amountWon = Decimal.min(
          Decimal.mul(amount, strikeMultiplier),
          maxPayout,
        )
          .mul(Decimal.sub(1, houseEdge))
          .toNumber();
        amountLost = Math.max(Decimal.sub(amount, amountWon).toNumber(), 0);

        feeGenerated = Decimal.min(
          Decimal.mul(amount, strikeMultiplier),
          maxPayout,
        )
          .sub(amountWon)
          .toNumber();

        result = amountWon > amount ? "Won" : "Lost";

        await User.findOneAndUpdate(
          {
            account,
            deposit: {
              $elemMatch: {
                tokenMint,
                amount: { $gte: amount },
              },
            },
          },
          {
            $inc: {
              "deposit.$.amount": amountWon,
            },
            ...(addGame ? { $addToSet: { gamesPlayed: GameType.mines } } : {}),
            $set: {
              isWeb2User: tokenMint === "SUPER",
            },
          },
        );
      }

      const record = await Mines.findOneAndUpdate(
        { account, result: "Pending" },
        {
          $setOnInsert: {
            wallet,
            amount,
            minesCount,
            strikeMultiplier,
            strikeNumbers,
            userBets,
            houseEdge,
            result,
            tokenMint,
            amountWon,
            amountLost,
            nonce,
            gameSeed: activeGameSeed._id,
          },
        },
        { upsert: true, new: true },
      ).populate("gameSeed");

      if (record?.nonce !== nonce)
        return res
          .status(400)
          .json({ success: false, message: "Pending game found!" });

      await updateGameStats(
        account,
        GameType.mines,
        tokenMint,
        amount,
        addGame,
        feeGenerated,
      );

      const { gameSeed, ...rest } = record.toObject();
      rest.game = GameType.mines;
      rest.userTier = 0;
      rest.gameSeed = { ...gameSeed, serverSeed: undefined };

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

      const message =
        result === "Won"
          ? "Congratulations! You won"
          : "Sorry, Better luck next time!";

      return res.status(201).json({
        success: true,
        result,
        amountWon,
        strikeNumbers,
        strikeMultiplier,
        pointsGained: userBets.length,
        message,
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

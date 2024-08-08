import { riskToChance } from "@/components/games/Plinko/RiskToChance";
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
import { GameSeed, Plinko, User } from "@/models/games";
import connectDatabase from "@/utils/database";
import {
  GameTokens,
  GameType,
  decryptServerSeed,
  generateGameResult,
  seedStatus,
} from "@/utils/provably-fair";
import updateGameStats from "@/utils/updateGameStats";
import { Decimal } from "decimal.js";
import { NextApiRequest, NextApiResponse } from "next";
Decimal.set({ precision: 9 });

/**
 * @swagger
 * /api/games/plinko:
 *   post:
 *     summary: Play a Plinko game
 *     description: This endpoint allows a user to play a Plinko game by betting a certain amount of tokens and selecting the number of rows and risk level. The game result is determined in a provably fair manner.
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
 *               rows:
 *                 type: number
 *                 description: The number of rows in the Plinko game. Should be between 8 and 16.
 *               risk:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 description: The risk level for the game. Determines the chances of winning.
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
 *                 strikeMultiplier:
 *                   type: number
 *                 strikeNumber:
 *                   type: number
 *                 amountWon:
 *                   type: number
 *                 amountLost:
 *                   type: number
 *                 rows:
 *                   type: number
 *       400:
 *         description: Bad request
 *       405:
 *         description: Method not allowed
 *       500:
 *         description: Internal server error
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
  rows: number;
  risk: "low" | "medium" | "high";
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, email, amount, tokenMint, rows, risk }: InputType =
        req.body;

      if (maintainance)
        return res.status(400).json({
          success: false,
          message: "Under maintenance",
        });

      const minGameAmount =
        maxPayouts[tokenMint][GameType.plinko] * minAmtFactor;

      if ((!wallet && !email) || !amount || !tokenMint || !rows || !risk)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      const splToken = SPL_TOKENS.find((t) => t.tokenMint === tokenMint);
      if (
        typeof amount !== "number" ||
        !isFinite(amount) ||
        !splToken ||
        !(
          Number.isInteger(rows) &&
          [8, 9, 10, 11, 12, 13, 14, 15, 16].includes(rows)
        ) ||
        !(risk === "low" || risk === "medium" || risk === "high")
      )
        return res
          .status(400)
          .json({ success: false, message: "Invalid parameters" });

      if (amount < minGameAmount)
        return res.status(400).json({
          success: false,
          message: "Invalid bet amount",
        });

      const multiplier = riskToChance[risk][rows];
      const maxPayout = new Decimal(maxPayouts[tokenMint].plinko);

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

      if (
        user.deposit.find((d: any) => d.tokenMint === tokenMint)?.amount <
        amount
      )
        return res
          .status(400)
          .json({ success: false, message: "Insufficient balance !" });

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
        GameType.plinko,
        rows,
      );

      let strikeMultiplier = 1;
      for (
        let i = 1, chance = 1, totalChance = chance;
        i <= rows;
        chance = (chance * (rows - i + 1)) / i, totalChance += chance, ++i
      ) {
        if (strikeNumber <= totalChance) {
          strikeMultiplier = multiplier[i - 1];
          break;
        }
      }
      /*
      chance = 1, totalChance = 1, i = 1
      chance = 1 * 8 / 1 = 8, totalChance = 9, i = 2
      chance = 8 * 7 / 2 = 28, totalChance = 37, i = 3
      chance = 28 * 6 / 3 = 56, totalChance = 93, i = 4
      chance = 56 * 5 / 4 = 70, totalChance = 163, i = 5
      */

      const amountWon = Decimal.min(
        Decimal.mul(amount, strikeMultiplier),
        maxPayout,
      ).mul(Decimal.sub(1, houseEdge));
      const amountLost = Math.max(
        new Decimal(amount).sub(amountWon).toNumber(),
        0,
      );
      const feeGenerated = Decimal.min(
        Decimal.mul(amount, strikeMultiplier),
        maxPayout,
      )
        .mul(houseEdge)
        .toNumber();

      const addGame = !user.gamesPlayed.includes(GameType.plinko);

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
          ...(addGame ? { $addToSet: { gamesPlayed: GameType.plinko } } : {}),
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

      const result = amountWon.toNumber() > amount ? "Won" : "Lost";
      const plinko = new Plinko({
        account,
        amount,
        rows,
        risk,
        strikeNumber,
        strikeMultiplier,
        tokenMint,
        houseEdge,
        result,
        amountWon,
        amountLost,
        nonce,
        gameSeed: activeGameSeed._id,
      });
      await plinko.save();

      await updateGameStats(
        account,
        GameType.plinko,
        tokenMint,
        amount,
        addGame,
        feeGenerated,
      );

      const record = await Plinko.populate(plinko, "gameSeed");
      const { gameSeed, ...rest } = record.toObject();
      rest.game = GameType.plinko;
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
          ? `Congratulations! You won`
          : `Sorry, Better luck next time!`;

      return res.status(201).json({
        success: true,
        message,
        result,
        strikeMultiplier,
        strikeNumber,
        amountWon: amountWon.toNumber(),
        amountLost,
        rows,
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

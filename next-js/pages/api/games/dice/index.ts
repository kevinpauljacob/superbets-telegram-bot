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
import { Dice, GameSeed, User } from "@/models/games";
import {
  GameTokens,
  GameType,
  decryptServerSeed,
  generateGameResult,
  seedStatus,
} from "@/utils/provably-fair";
import { Decimal } from "decimal.js";
import { NextApiRequest, NextApiResponse } from "next";
import connectDatabase from "../../../../utils/database";
import updateGameStats from "../../../../utils/updateGameStats";
Decimal.set({ precision: 9 });

/**
 * @swagger
 * /api/games/dice:
 *   post:
 *     summary: Play a dice game
 *     description: This endpoint allows a user to play a dice game by betting a certain amount of tokens and choosing numbers. The game result is determined in a provably fair manner.
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
 *               chosenNumbers:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: The numbers chosen by the user for the dice game.
 *     responses:
 *       200:
 *         description: Game played successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     strikeNumber:
 *                       type: number
 *                     strikeMultiplier:
 *                       type: number
 *                     result:
 *                       type: string
 *                     amountWon:
 *                       type: number
 *                     amountLost:
 *                       type: number
 *                 message:
 *                   type: string
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
  chosenNumbers: number[];
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, email, amount, tokenMint, chosenNumbers }: InputType =
        req.body;

      const minGameAmount = maxPayouts[tokenMint][GameType.dice] * minAmtFactor;

      if (maintainance)
        return res.status(400).json({
          success: false,
          message: "Under maintenance",
        });

      if ((!wallet && !email) || !amount || !tokenMint)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      //check if all values are unique whole numbers between 1 and 6
      const splToken = SPL_TOKENS.find((t) => t.tokenMint === tokenMint);
      if (
        typeof amount !== "number" ||
        !isFinite(amount) ||
        !splToken ||
        !(
          chosenNumbers &&
          chosenNumbers.length >= 1 &&
          chosenNumbers.length <= 5 &&
          chosenNumbers.every(
            (v: any) => Number.isInteger(v) && v >= 1 && v <= 6,
          )
        ) ||
        !isArrayUnique(chosenNumbers)
      )
        return res
          .status(400)
          .json({ success: false, message: "Invalid chosen numbers" });

      if (amount < minGameAmount)
        return res.status(400).json({
          success: false,
          message: "Invalid bet amount",
        });

      const strikeMultiplier = new Decimal(6 / chosenNumbers.length);
      const maxPayout = new Decimal(maxPayouts[tokenMint].dice);

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
        GameType.dice,
      );

      let result = "Lost";
      let amountWon = new Decimal(0);
      let amountLost = amount;
      let feeGenerated = 0;

      if (chosenNumbers.includes(strikeNumber)) {
        result = "Won";
        amountWon = Decimal.min(
          Decimal.mul(amount, strikeMultiplier),
          maxPayout,
        ).mul(Decimal.sub(1, houseEdge));
        amountLost = 0;

        feeGenerated = Decimal.min(
          Decimal.mul(amount, strikeMultiplier),
          maxPayout,
        )
          .mul(houseEdge)
          .toNumber();
      }

      const addGame = !user.gamesPlayed.includes(GameType.dice);

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
            "deposit.$.amount": amountWon.minus(amount).toNumber(),
            numOfGamesPlayed: 1,
          },
          ...(addGame ? { $addToSet: { gamesPlayed: GameType.dice } } : {}),
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

      const dice = new Dice({
        account,
        amount,
        chosenNumbers,
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
      await dice.save();

      await updateGameStats(
        account,
        GameType.dice,
        tokenMint,
        amount,
        addGame,
        feeGenerated,
      );

      const record = await Dice.populate(dice, "gameSeed");
      const { gameSeed, ...rest } = record.toObject();
      rest.game = GameType.dice;
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

      return res.status(201).json({
        success: true,
        data: {
          strikeNumber,
          strikeMultiplier: strikeMultiplier.toNumber(),
          result,
          amountWon: amountWon.toNumber(),
          amountLost,
        },
        message:
          result === "Won"
            ? "Congratulations! You won"
            : "Sorry, Better luck next time!",
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message });
    }
  } else
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
}

export default handler;

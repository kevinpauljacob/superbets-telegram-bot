import {
  houseEdgeTiers,
  launchPromoEdge,
  maintainance,
  maxPayouts,
  stakingTiers,
  wsEndpoint,
} from "@/context/config";
import { GameSeed, Roulette2, User } from "@/models/games";
import connectDatabase from "@/utils/database";
import {
  GameTokens,
  GameType,
  decryptServerSeed,
  generateGameResult,
  seedStatus,
} from "@/utils/provably-fair";
import { NextApiRequest, NextApiResponse } from "next";

import { SPL_TOKENS, minGameAmount } from "@/context/config";
import { Decimal } from "decimal.js";
import updateGameStats from "../../../../utils/updateGameStats";
Decimal.set({ precision: 9 });

/**
 * @swagger
 *
 * /games/roulette2:
 *   post:
 *     summary: Play a game of Roulette
 *     description: Allows users to place a bet on a roulette game and get the result.
 *     tags:
 *       - Games
 *     requestBody:
 *       description: User's game bet information
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               wallet:
 *                 type: string
 *                 description: User's wallet address.
 *                 example: "0x1234567890abcdef"
 *               email:
 *                 type: string
 *                 description: User's email address.
 *                 example: "user@example.com"
 *               tokenMint:
 *                 type: string
 *                 description: The token mint associated with the wager.
 *                 example: "TOKEN_MINT"
 *               wager:
 *                 type: object
 *                 properties:
 *                   red:
 *                     type: number
 *                     description: Bet amount on red.
 *                     example: 10
 *                   black:
 *                     type: number
 *                     description: Bet amount on black.
 *                     example: 5
 *                   green:
 *                     type: number
 *                     description: Bet amount on green.
 *                     example: 2
 *                   odd:
 *                     type: number
 *                     description: Bet amount on odd numbers.
 *                     example: 8
 *                   even:
 *                     type: number
 *                     description: Bet amount on even numbers.
 *                     example: 4
 *                   low:
 *                     type: number
 *                     description: Bet amount on numbers 1-18.
 *                     example: 3
 *                   high:
 *                     type: number
 *                     description: Bet amount on numbers 19-36.
 *                     example: 6
 *                   1st-12:
 *                     type: number
 *                     description: Bet amount on the first dozen.
 *                     example: 7
 *                   2nd-12:
 *                     type: number
 *                     description: Bet amount on the second dozen.
 *                     example: 5
 *                   3rd-12:
 *                     type: number
 *                     description: Bet amount on the third dozen.
 *                     example: 9
 *                   1st-column:
 *                     type: number
 *                     description: Bet amount on the first column.
 *                     example: 11
 *                   2nd-column:
 *                     type: number
 *                     description: Bet amount on the second column.
 *                     example: 12
 *                   3rd-column:
 *                     type: number
 *                     description: Bet amount on the third column.
 *                     example: 10
 *                   straight:
 *                     type: object
 *                     description: Bet amount on specific numbers.
 *                     additionalProperties:
 *                       type: number
 *                       example: 1
 *     responses:
 *       201:
 *         description: Successful response with game result.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Congratulations! You Won 20"
 *                 strikeNumber:
 *                   type: integer
 *                   example: 17
 *                 result:
 *                   type: string
 *                   example: "Won"
 *                 strikeMultiplier:
 *                   type: number
 *                   format: float
 *                   example: 2.0
 *                 amountWon:
 *                   type: number
 *                   format: float
 *                   example: 20
 *                 amountLost:
 *                   type: number
 *                   format: float
 *                   example: 0
 *       400:
 *         description: Bad request due to invalid parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid parameters"
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "An error occurred"
 *       405:
 *         description: Method not allowed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Method not allowed"
 */

const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");

export const config = {
  maxDuration: 60,
};

type WagerType =
  | "red"
  | "black"
  | "green"
  | "odd"
  | "even"
  | "low"
  | "high"
  | "1st-12"
  | "2nd-12"
  | "3rd-12"
  | "1st-column"
  | "2nd-column"
  | "3rd-column"
  | "straight";

const WagerMapping: Record<WagerType, Array<number> | Record<string, number>> =
  {
    red: [1, 3, 5, 7, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36],
    black: [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35],
    green: [0, 37],
    odd: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35],
    even: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36],
    low: [...Array(18).keys()].map((x) => x + 1),
    high: [...Array(18).keys()].map((x) => x + 19),
    "1st-12": [...Array(12).keys()].map((x) => x + 1),
    "2nd-12": [...Array(12).keys()].map((x) => x + 13),
    "3rd-12": [...Array(12).keys()].map((x) => x + 25),
    "1st-column": [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
    "2nd-column": [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
    "3rd-column": [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
    straight: {
      "0": 0,
      "1": 1,
      "2": 2,
      "3": 3,
      "4": 4,
      "5": 5,
      "6": 6,
      "7": 7,
      "8": 8,
      "9": 9,
      "10": 10,
      "11": 11,
      "12": 12,
      "13": 13,
      "14": 14,
      "15": 15,
      "16": 16,
      "17": 17,
      "18": 18,
      "19": 19,
      "20": 20,
      "21": 21,
      "22": 22,
      "23": 23,
      "24": 24,
      "25": 25,
      "26": 26,
      "27": 27,
      "28": 28,
      "29": 29,
      "30": 30,
      "31": 31,
      "32": 32,
      "33": 33,
      "34": 34,
      "35": 35,
      "36": 36,
      "37": 37,
    },
  };

const WagerPayout: Record<WagerType, number> = {
  red: 2,
  black: 2,
  green: 36,
  odd: 2,
  even: 2,
  low: 2,
  high: 2,
  "1st-12": 3,
  "2nd-12": 3,
  "3rd-12": 3,
  "1st-column": 3,
  "2nd-column": 3,
  "3rd-column": 3,
  straight: 36,
};

type Wager = Record<WagerType, number | Record<string, number>>;

type InputType = {
  wallet: string;
  email: string;
  tokenMint: GameTokens;
  wager: Wager;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  return res
    .status(405)
    .json({ success: false, message: "Method not allowed!" });

  if (req.method === "POST") {
    try {
      let { wallet, email, tokenMint, wager }: InputType = req.body;

      if (maintainance)
        return res.status(400).json({
          success: false,
          message: "Under maintenance",
        });

      if ((!wallet && !email) || !tokenMint || !wager)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      const splToken = SPL_TOKENS.find((t) => t.tokenMint === tokenMint);
      if (
        !splToken ||
        !Object.keys(wager).every((key) => WagerMapping[key as WagerType])
      )
        return res
          .status(400)
          .json({ success: false, message: "Invalid parameters" });

      const amount = Object.entries(wager)
        .reduce((acc, next) => {
          if (next[0] === "straight") {
            const straightTotal = Object.values(
              next[1] as Record<string, number>,
            ).reduce((acc, next) => acc.add(next), new Decimal(0));

            return acc.add(straightTotal);
          } else {
            return acc.add(next[1] as number);
          }
        }, new Decimal(0))
        .toNumber();

      if (amount < minGameAmount)
        return res.status(400).json({
          success: false,
          message: "Invalid bet amount",
        });

      await connectDatabase();

      const maxPayout = new Decimal(maxPayouts[tokenMint].roulette2);

      const isSuperToken = tokenMint === "SUPER";
      if (!isSuperToken && amount > maxPayout.toNumber())
        return res.status(400).json({
          success: false,
          message: "Bet amount exceeds max payout!",
        });

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
          .json({ success: false, message: "User does not exist !" });

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
        GameType.roulette2,
      );

      let amountWon = new Decimal(0);

      let strikeMultiplier = new Decimal(0);

      Object.entries(wager).forEach(([key, value]) => {
        if (key === "straight") {
          if (
            (value as Record<string, number>)[strikeNumber.toString()] != null
          ) {
            let winAmount = Decimal.mul(
              (value as Record<string, number>)[strikeNumber.toString()],
              WagerPayout[key],
            );

            amountWon = amountWon.add(winAmount);

            strikeMultiplier = winAmount.mul(WagerPayout[key]);
          }
        } else if (
          (WagerMapping[key as WagerType] as Array<number>).includes(
            strikeNumber,
          )
        ) {
          let winAmount = Decimal.mul(
            value as number,
            WagerPayout[key as WagerType],
          );

          amountWon = amountWon.add(winAmount);

          strikeMultiplier = winAmount.mul(WagerPayout[key as WagerType]);
        }
      });

      strikeMultiplier = Decimal.div(strikeMultiplier, amount);

      amountWon = Decimal.min(amountWon, maxPayout).mul(
        Decimal.sub(1, houseEdge),
      );

      const feeGenerated = Decimal.min(amountWon, maxPayout)
        .mul(houseEdge)
        .toNumber();
      const amountLost = Math.max(Decimal.sub(amount, amountWon).toNumber(), 0);

      const addGame = !user.gamesPlayed.includes(GameType.roulette2);

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
          ...(addGame
            ? { $addToSet: { gamesPlayed: GameType.roulette2 } }
            : {}),
          $set: {
            isWeb2User: tokenMint === "SUPER",
          },
        },
        {
          new: true,
        },
      );

      if (!userUpdate) {
        throw new Error("Insufficient balance for action!!");
      }

      const result = amountWon.toNumber() > amount ? "Won" : "Lost";
      const roulette2 = new Roulette2({
        account,
        amount,
        wager,
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
      await roulette2.save();

      await updateGameStats(
        account,
        GameType.roulette2,
        tokenMint,
        amount,
        addGame,
        feeGenerated,
      );

      const record = await Roulette2.populate(roulette2, "gameSeed");
      const { gameSeed, ...rest } = record.toObject();
      rest.game = GameType.roulette2;
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
        message:
          result === "Won"
            ? `Congratulations! You Won ${amountWon}`
            : "Better luck next time!",
        strikeNumber,
        result,
        strikeMultiplier: strikeMultiplier.toNumber(),
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

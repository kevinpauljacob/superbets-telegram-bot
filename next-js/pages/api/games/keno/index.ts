import { riskToChance } from "@/components/games/Keno/RiskToChance";
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
import { isArrayUnique } from "@/context/transactions";
import { GameSeed, Keno, User } from "@/models/games";
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
 * /api/games/keno:
 *   post:
 *     summary: Play a keno game
 *     description: This endpoint allows a user to play a keno game by betting a certain amount of tokens, choosing numbers, and selecting a risk level. The game result is determined in a provably fair manner.
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
 *                 description: An array of chosen numbers between 1 and 40.
 *               risk:
 *                 type: string
 *                 enum: [classic, low, medium, high]
 *                 description: The risk level chosen by the user.
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
 *                 strikeNumbers:
 *                   type: array
 *                   items:
 *                     type: number
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
  risk: "classic" | "low" | "medium" | "high";
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, email, amount, tokenMint, chosenNumbers, risk }: InputType =
        req.body;

      const minGameAmount = maxPayouts[tokenMint][GameType.keno] * minAmtFactor;

      if (maintainance)
        return res.status(400).json({
          success: false,
          message: "Under maintenance",
        });

      if (
        (!wallet && !email) ||
        !amount ||
        !tokenMint ||
        !chosenNumbers ||
        !risk
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
          1 <= chosenNumbers.length &&
          chosenNumbers.length <= 10 &&
          chosenNumbers.every((n) => 1 <= n && n <= 40 && Number.isInteger(n))
        ) ||
        !(
          risk === "classic" ||
          risk === "low" ||
          risk === "medium" ||
          risk === "high"
        ) ||
        !isArrayUnique(chosenNumbers)
      )
        return res
          .status(400)
          .json({ success: false, message: "Invalid parameters" });

      if (amount < minGameAmount)
        return res.status(400).json({
          success: false,
          message: "Invalid bet amount",
        });

      const multiplier = riskToChance[risk][chosenNumbers.length];

      const maxPayout = new Decimal(maxPayouts[tokenMint].keno);

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

      const strikeNumbers = generateGameResult(
        serverSeed,
        clientSeed,
        nonce,
        GameType.keno,
      );

      if (!strikeNumbers) throw new Error("Invalid strike number!");

      //find the number of matches in strikeNumbers and chosenNumbers
      let matches = 0;
      chosenNumbers.forEach((number) => {
        if (strikeNumbers.includes(number)) {
          matches++;
        }
      });
      const strikeMultiplier = multiplier[matches];
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

      const addGame = !user.gamesPlayed.includes(GameType.keno);

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
          ...(addGame ? { $addToSet: { gamesPlayed: GameType.keno } } : {}),
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
      const keno = new Keno({
        account,
        amount,
        chosenNumbers,
        risk,
        strikeNumbers,
        strikeMultiplier,
        tokenMint,
        houseEdge,
        result,
        amountWon,
        amountLost,
        nonce,
        gameSeed: activeGameSeed._id,
      });
      await keno.save();

      await updateGameStats(
        wallet,
        email,
        GameType.keno,
        tokenMint,
        amount,
        addGame,
        feeGenerated,
      );

      const record = await Keno.populate(keno, "gameSeed");
      const { gameSeed, ...rest } = record.toObject();
      rest.game = GameType.keno;
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
        message: message,
        result,
        strikeNumbers,
        strikeMultiplier,
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

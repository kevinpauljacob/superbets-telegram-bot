import { riskToChance } from "@/components/games/Wheel/Segments";
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
import { GameSeed, User, Wheel } from "@/models/games";
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
 * /games/wheel:
 *   post:
 *     summary: Play a wheel game.
 *     description: This endpoint allows a user to play a wheel game by betting a certain amount of tokens and choosing a risk level.
 *     tags:
 *       - Games
 *     requestBody:
 *       description: The input data for placing a bet.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               wallet:
 *                 type: string
 *                 description: The wallet address of the user.
 *                 example: "0x123456789abcdef"
 *               email:
 *                 type: string
 *                 description: The email address of the user.
 *                 example: "user@example.com"
 *               amount:
 *                 type: number
 *                 description: The amount of tokens to bet.
 *                 example: 10
 *               tokenMint:
 *                 type: string
 *                 description: The token mint type used for the game.
 *                 example: "TOKEN_MINT_EXAMPLE"
 *               segments:
 *                 type: number
 *                 description: The number of segments on the wheel (must be between 10 and 50, inclusive, and divisible by 10).
 *                 example: 20
 *               risk:
 *                 type: string
 *                 enum:
 *                   - low
 *                   - medium
 *                   - high
 *                 description: The risk level of the bet.
 *                 example: "medium"
 *             required:
 *               - wallet
 *               - email
 *               - amount
 *               - tokenMint
 *               - segments
 *               - risk
 *     responses:
 *       200:
 *         description: Bet placed successfully and result returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates whether the bet was processed successfully.
 *                   example: true
 *                 message:
 *                   type: string
 *                   description: Message describing the result of the bet.
 *                   example: "Congratulations! You won"
 *                 result:
 *                   type: string
 *                   description: The result of the bet, either "Won" or "Lost".
 *                   example: "Won"
 *                 segments:
 *                   type: number
 *                   description: The number of segments on the wheel.
 *                   example: 20
 *                 risk:
 *                   type: string
 *                   description: The risk level of the bet.
 *                   example: "medium"
 *                 strikeNumber:
 *                   type: number
 *                   description: The generated strike number.
 *                   example: 15
 *                 amountWon:
 *                   type: number
 *                   description: The amount won by the user.
 *                   example: 30
 *                 amountLost:
 *                   type: number
 *                   description: The amount lost by the user.
 *                   example: 10
 *                 strikeMultiplier:
 *                   type: number
 *                   description: The multiplier applied to the bet.
 *                   example: 3
 *       400:
 *         description: Bad request due to invalid parameters or missing data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates failure due to bad request.
 *                   example: false
 *                 message:
 *                   type: string
 *                   description: Message describing the error.
 *                   example: "Invalid parameters"
 *       405:
 *         description: Method not allowed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates failure due to method not being allowed.
 *                   example: false
 *                 message:
 *                   type: string
 *                   description: Message describing the error.
 *                   example: "Method not allowed"
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates failure due to an internal server error.
 *                   example: false
 *                 message:
 *                   type: string
 *                   description: Message describing the error.
 *                   example: "Server error"
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
  segments: number;
  risk: "low" | "medium" | "high";
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, email, amount, tokenMint, segments, risk }: InputType =
        req.body;

      const minGameAmount =
        maxPayouts[tokenMint][GameType.wheel] * minAmtFactor;

      if (maintainance)
        return res.status(400).json({
          success: false,
          message: "Under maintenance",
        });

      if ((!wallet && !email) || !amount || !tokenMint || !segments || !risk)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      const splToken = SPL_TOKENS.find((t) => t.tokenMint === tokenMint);
      if (
        typeof amount !== "number" ||
        !isFinite(amount) ||
        !splToken ||
        !(10 <= segments && segments <= 50 && segments % 10 === 0) ||
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

      const item = riskToChance[risk];
      const maxPayout = new Decimal(maxPayouts[tokenMint].wheel);

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
        GameType.wheel,
      );

      if (!strikeNumber) throw new Error("Invalid strike number!");

      let result = "Lost";
      let amountWon = new Decimal(0);
      let amountLost = amount;
      let feeGenerated = 0;

      let strikeMultiplier = 0;

      for (let i = 0, isFound = false; i < 100 && !isFound; ) {
        for (let j = 0; j < item.length; j++) {
          i += (item[j].chance * 10) / segments;
          if (i >= strikeNumber) {
            strikeMultiplier = item[j].multiplier;
            if (item[j].multiplier !== 0) {
              amountWon = Decimal.min(
                Decimal.mul(amount, strikeMultiplier),
                maxPayout,
              ).mul(Decimal.sub(1, houseEdge));
              amountLost = Math.max(
                Decimal.sub(amount, amountWon).toNumber(),
                0,
              );

              result = amountWon.toNumber() > amount ? "Won" : "Lost";

              feeGenerated = Decimal.min(
                Decimal.mul(amount, strikeMultiplier),
                maxPayout,
              )
                .mul(houseEdge)
                .toNumber();
            }
            isFound = true;
            break;
          }
        }
      }

      const addGame = !user.gamesPlayed.includes(GameType.wheel);

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
          ...(addGame ? { $addToSet: { gamesPlayed: GameType.wheel } } : {}),
          $set: {
            isWeb2User: tokenMint === "SUPER",
          },
        },
        {
          new: true,
        },
      );

      if (!userUpdate) {
        throw new Error("insufficient balance for bet!");
      }

      const wheel = new Wheel({
        account,
        amount,
        segments,
        risk,
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
      await wheel.save();

      await updateGameStats(
        account,
        GameType.wheel,
        tokenMint,
        amount,
        addGame,
        feeGenerated,
      );

      const record = await Wheel.populate(wheel, "gameSeed");
      const { gameSeed, ...rest } = record.toObject();
      rest.game = GameType.wheel;
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
            ? "Congratulations! You won"
            : "Sorry, Better luck next time!",
        result,
        segments,
        risk,
        strikeNumber,
        amountWon: amountWon.toNumber(),
        amountLost,
        strikeMultiplier,
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

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
import { Dice2, GameSeed, User } from "@/models/games";
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
 * /games/dice2:
 *   post:
 *     summary: Play a dice2 game
 *     description: This endpoint allows a user to play a dice2 game by betting a certain amount of tokens and choosing a chance and direction. The game result is determined in a provably fair manner.
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
 *               chance:
 *                 type: number
 *                 description: The chance percentage chosen by the user.
 *               direction:
 *                 type: string
 *                 enum: [over, under]
 *                 description: The direction chosen by the user (either "over" or "under").
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
 *                 strikeNumber:
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
  chance: number;
  direction: "over" | "under";
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, email, amount, tokenMint, chance, direction }: InputType =
        req.body;

      const minGameAmount =
        maxPayouts[tokenMint][GameType.dice2] * minAmtFactor;

      if (maintainance)
        return res.status(400).json({
          success: false,
          message: "Under maintenance",
        });

      if ((!wallet && !email) || !amount || !tokenMint || !chance || !direction)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      const splToken = SPL_TOKENS.find((t) => t.tokenMint === tokenMint);
      if (
        typeof amount !== "number" ||
        !isFinite(amount) ||
        !splToken ||
        !(2 <= chance && chance <= 98) ||
        !(direction === "over" || direction === "under")
      )
        return res
          .status(400)
          .json({ success: false, message: "Invalid parameters" });

      if (amount < minGameAmount)
        return res.status(400).json({
          success: false,
          message: "Invalid bet amount",
        });

      const strikeMultiplier = new Decimal(100).dividedBy(chance).toDP(6);
      const maxPayout = new Decimal(maxPayouts[tokenMint].dice2);

      const isSuperToken = tokenMint === "SUPER";
      if (!isSuperToken && amount > maxPayout.toNumber())
        return res.status(400).json({
          success: false,
          message: "Bet amount exceeds max payout!",
        });

      await connectDatabase();

      let user = null;
      if (email) {
        user = await User.findOne({ email });
      } else if (wallet) {
        user = await User.findOne({ wallet });
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
        GameType.dice2,
      );

      if (!strikeNumber) throw new Error("Invalid strike number!");

      let result = "Lost";
      let amountWon = new Decimal(0);
      let amountLost = amount;
      let feeGenerated = 0;

      if (
        (direction === "over" && strikeNumber > 100 - chance) ||
        (direction === "under" && strikeNumber < chance)
      ) {
        result = "Won";
        amountWon = Decimal.min(
          Decimal.mul(amount, strikeMultiplier),
          maxPayout,
        ).mul(Decimal.sub(1, houseEdge));
        amountLost = Math.max(new Decimal(amount).sub(amountWon).toNumber(), 0);

        feeGenerated = Decimal.min(
          Decimal.mul(amount, strikeMultiplier),
          maxPayout,
        )
          .mul(houseEdge)
          .toNumber();
      }

      const addGame = !user.gamesPlayed.includes(GameType.dice2);

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
          ...(addGame ? { $addToSet: { gamesPlayed: GameType.dice2 } } : {}),
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

      const dice2 = new Dice2({
        account,
        amount,
        direction,
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
      await dice2.save();

      await updateGameStats(
        account,
        GameType.dice2,
        tokenMint,
        amount,
        addGame,
        feeGenerated,
      );

      const record = await Dice2.populate(dice2, "gameSeed");
      const { gameSeed, ...rest } = record.toObject();
      rest.game = GameType.dice2;
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
        strikeNumber,
        amountWon: amountWon.toNumber(),
        amountLost,
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message });
    }
  } else {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }
}

export default handler;

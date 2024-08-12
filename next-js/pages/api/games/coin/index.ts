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
import { Coin, GameSeed, User } from "@/models/games";
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
 * tags:
 *  name: Games
 *  description: Game related operations
 */

/**
 * @swagger
 * /api/games/coin:
 *   post:
 *     summary: Play a coin flip game
 *     description: This endpoint allows a user to play a coin flip game by betting a certain amount of tokens. The game result is determined in a provably fair manner.
 *     tags:
 *      - Games
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email of the user.
 *               amount:
 *                 type: number
 *                 description: The amount of tokens to bet.
 *               tokenMint:
 *                 type: string
 *                 description: The token mint of the token being bet.
 *               flipType:
 *                 type: string
 *                 enum: ["heads", "tails"]
 *                 description: The side to bet on (heads or tails).
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
  email: string;
  amount: number;
  tokenMint: GameTokens;
  flipType: "heads" | "tails";
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { email, amount, tokenMint, flipType }: InputType = req.body;

      const minGameAmount = maxPayouts[tokenMint][GameType.coin] * minAmtFactor;

      if (maintainance)
        return res.status(400).json({
          success: false,
          message: "Under maintenance",
        });

      if (!email || !amount || !flipType || !tokenMint)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      const splToken = SPL_TOKENS.find((t) => t.tokenMint === tokenMint);
      if (
        typeof amount !== "number" ||
        !isFinite(amount) ||
        !splToken ||
        !(flipType === "heads" || flipType === "tails")
      )
        return res
          .status(400)
          .json({ success: false, message: "Invalid parameters" });

      if (amount < minGameAmount)
        return res.status(400).json({
          success: false,
          message: "Invalid bet amount",
        });

      await connectDatabase();

      const strikeMultiplier = 2;
      const maxPayout = new Decimal(maxPayouts[tokenMint].coinflip);

      const isSuperToken = tokenMint === "SUPER";
      if (!isSuperToken && amount > maxPayout.toNumber())
        return res.status(400).json({
          success: false,
          message: "Bet amount exceeds max payout!",
        });

      let user = null;
      user = await User.findOne({
        email: email,
      });

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
        GameType.coin,
      );

      let result = "Lost";
      let amountWon = new Decimal(0);
      let amountLost = amount;
      let feeGenerated = 0;

      if (
        (flipType === "heads" && strikeNumber === 1) ||
        (flipType === "tails" && strikeNumber === 2)
      ) {
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
      const addGame = !user.gamesPlayed.includes(GameType.coin);
      let userUpdate;
      try {
        userUpdate = await User.findOneAndUpdate(
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
            ...(addGame ? { $addToSet: { gamesPlayed: GameType.coin } } : {}),
            $set: {
              isWeb2User: tokenMint === "SUPER",
            },
          },
          {
            new: true,
          },
        );
      } catch (e) {
        console.error(e);
      }
      console.log("update failed");
      if (!userUpdate) {
        throw new Error("Insufficient balance for bet!");
      }

      const coin = new Coin({
        account,
        amount,
        flipType,
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
      await coin.save();

      await updateGameStats(
        account,
        GameType.coin,
        tokenMint,
        amount,
        addGame,
        feeGenerated,
      );

      const record = await Coin.populate(coin, "gameSeed");
      const { gameSeed, ...rest } = record.toObject();
      rest.game = GameType.coin;
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

      return res.json({
        success: true,
        data: { strikeNumber, result, amountWon, amountLost },
        message:
          result == "Won"
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

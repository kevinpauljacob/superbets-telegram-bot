import connectDatabase from "../../../../utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { wsEndpoint } from "@/context/config";
import { GameSeed, User, Dice } from "@/models/games";
import {
  GameTokens,
  GameType,
  decryptServerSeed,
  generateGameResult,
  seedStatus,
} from "@/utils/provably-fair";
import StakingUser from "@/models/staking/user";
import { isArrayUnique } from "@/context/transactions";
import {
  houseEdgeTiers,
  maxPayouts,
  minAmtFactor,
  pointTiers,
  stakingTiers,
} from "@/context/config";
import { launchPromoEdge, maintainance } from "@/context/config";
import { Decimal } from "decimal.js";
import { SPL_TOKENS } from "@/context/config";
import updateGameStats from "../../../../utils/updateGameStats";
Decimal.set({ precision: 9 });

const secret = process.env.NEXTAUTH_SECRET;
const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");

export const config = {
  maxDuration: 60,
};

type InputType = {
  wallet: string;
  email: string;
  amount: number;
  tokenMint: string;
  chosenNumbers: number[];
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, email, amount, tokenMint, chosenNumbers }: InputType = req.body;

      const minGameAmount =
        maxPayouts[tokenMint as GameTokens]["dice" as GameType] * minAmtFactor;

      if (maintainance)
        return res.status(400).json({
          success: false,
          message: "Under maintenance",
        });

      const token = await getToken({ req, secret });

      if (
        !token ||
        !token.sub ||
        (wallet && token.sub != wallet) ||
        (email && token.email !== email)
      )
        return res.status(400).json({
          success: false,
          message: "User not authenticated",
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
      const maxPayout = Decimal.mul(amount, strikeMultiplier);
      if (!(maxPayout.toNumber() <= maxPayouts[tokenMint as GameTokens].dice))
        return res
          .status(400)
          .json({ success: false, message: "Max payout exceeded" });

      await connectDatabase();

      let user = await User.findOne({
        $or: [{ wallet: wallet }, { email: email }],
      });

      if (!user)
        return res
          .status(400)
          .json({ success: false, message: "User does not exist!" });

      if (!user.isWeb2User && tokenMint === "WEB2")
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

      let userData;
      if (wallet)
        userData = await StakingUser.findOneAndUpdate(
          { wallet },
          {},
          { upsert: true, new: true },
        );

      const stakeAmount = userData?.stakedAmount ?? 0;
      const stakingTier = Object.entries(stakingTiers).reduce((prev, next) => {
        return stakeAmount >= next[1]?.limit ? next : prev;
      })[0];
      const houseEdge =
        launchPromoEdge
          ? 0
          : houseEdgeTiers[parseInt(stakingTier)];

      const activeGameSeed = await GameSeed.findOneAndUpdate(
        {
          wallet,
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
        amountWon = Decimal.mul(amount, strikeMultiplier).mul(
          Decimal.sub(1, houseEdge),
        );
        amountLost = 0;

        feeGenerated = Decimal.mul(amount, strikeMultiplier)
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
            isWeb2User: tokenMint === "WEB2",
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
        wallet,
        GameType.dice,
        tokenMint,
        amount,
        addGame,
        feeGenerated,
      );

      // const pointsGained =
      //   0 * user.numOfGamesPlayed + 1.4 * amount * userData.multiplier;

      // const points = userData.points + pointsGained;
      // const newTier = Object.entries(pointTiers).reduce((prev, next) => {
      //   return points >= next[1]?.limit ? next : prev;
      // })[0];

      // await StakingUser.findOneAndUpdate(
      //   {
      //     wallet,
      //   },
      //   {
      //     $inc: {
      //       points: pointsGained,
      //     },
      //   },
      // );

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
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  } else
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
}

export default handler;

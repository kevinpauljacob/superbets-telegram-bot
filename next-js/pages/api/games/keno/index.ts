import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { GameSeed, Keno, User } from "@/models/games";
import {
  generateGameResult,
  GameType,
  seedStatus,
  decryptServerSeed,
  GameTokens,
} from "@/utils/provably-fair";
import StakingUser from "@/models/staking/user";
import {
  houseEdgeTiers,
  isArrayUnique,
  launchPromoEdge,
  maintainance,
  maxPayouts,
  minAmtFactor,
  pointTiers,
  stakingTiers,
} from "@/context/transactions";
import { wsEndpoint } from "@/context/config";
import { riskToChance } from "@/components/games/Keno/RiskToChance";
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
  amount: number;
  tokenMint: string;
  chosenNumbers: number[];
  risk: "classic" | "low" | "medium" | "high";
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, amount, tokenMint, chosenNumbers, risk }: InputType =
        req.body;

      const minGameAmount =
        maxPayouts[tokenMint as GameTokens]["keno" as GameType] * minAmtFactor;

      if (maintainance)
        return res.status(400).json({
          success: false,
          message: "Under maintenance",
        });

      const token = await getToken({ req, secret });

      if (!token || !token.sub || token.sub != wallet)
        return res.status(400).json({
          success: false,
          message: "User wallet not authenticated",
        });

      if (!wallet || !amount || !tokenMint || !chosenNumbers || !risk)
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
      const maxStrikeMultiplier = multiplier.at(-1)!;

      const maxPayout = Decimal.mul(amount, maxStrikeMultiplier);

      if (!(maxPayout.toNumber() <= maxPayouts[tokenMint as GameTokens].keno))
        return res
          .status(400)
          .json({ success: false, message: "Max payout exceeded" });
      await connectDatabase();

      let user = await User.findOne({ wallet });

      if (!user)
        return res
          .status(400)
          .json({ success: false, message: "User does not exist !" });

      if (
        user.deposit.find((d: any) => d.tokenMint === tokenMint)?.amount <
        amount
      )
        return res
          .status(400)
          .json({ success: false, message: "Insufficient balance !" });

      const userData = await StakingUser.findOneAndUpdate(
        { wallet },
        {},
        { upsert: true, new: true },
      );

      const stakeAmount = userData?.stakedAmount ?? 0;
      const stakingTier = Object.entries(stakingTiers).reduce((prev, next) => {
        return stakeAmount >= next[1]?.limit ? next : prev;
      })[0];
      const isFomoToken =
        tokenMint === SPL_TOKENS.find((t) => t.tokenName === "FOMO")?.tokenMint
          ? true
          : false;
      const houseEdge =
        launchPromoEdge || isFomoToken
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
      const amountWon = Decimal.mul(amount, strikeMultiplier).mul(
        Decimal.sub(1, houseEdge),
      );
      const amountLost = Math.max(
        new Decimal(amount).sub(amountWon).toNumber(),
        0,
      );

      const feeGenerated = Decimal.mul(amount, strikeMultiplier)
        .mul(houseEdge)
        .toNumber();

      const addGame = !user.gamesPlayed.includes(GameType.keno);

      const userUpdate = await User.findOneAndUpdate(
        {
          wallet,
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
        },
        {
          new: true,
        },
      );

      if (!userUpdate) {
        throw new Error("Insufficient balance for action!!");
      }

      const result = amountWon.toNumber() > amount ? "Won" : "Lost";
      const keno = new Keno({
        wallet,
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
        GameType.keno,
        tokenMint,
        amount,
        addGame,
        feeGenerated,
      );

      const pointsGained =
        0 * user.numOfGamesPlayed + 1.4 * amount * userData.multiplier;

      const points = userData.points + pointsGained;
      const newTier = Object.entries(pointTiers).reduce((prev, next) => {
        return points >= next[1]?.limit ? next : prev;
      })[0];

      await StakingUser.findOneAndUpdate(
        {
          wallet,
        },
        {
          $inc: {
            points: pointsGained,
          },
        },
      );

      const record = await Keno.populate(keno, "gameSeed");
      const { gameSeed, ...rest } = record.toObject();
      rest.game = GameType.keno;
      rest.userTier = parseInt(newTier);
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
          ? `Congratulations! You won ${amountWon}!`
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

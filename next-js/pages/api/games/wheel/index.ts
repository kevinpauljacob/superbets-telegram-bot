import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { GameSeed, Wheel, User } from "@/models/games";
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
  maxPayouts,
  minAmtFactor,
  pointTiers,
  stakingTiers,
} from "@/context/config";
import { launchPromoEdge, maintainance } from "@/context/config";
import { minGameAmount, wsEndpoint } from "@/context/config";
import { riskToChance } from "@/components/games/Wheel/Segments";
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
  segments: number;
  risk: "low" | "medium" | "high";
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, email, amount, tokenMint, segments, risk }: InputType =
        req.body;

      const minGameAmount =
        maxPayouts[tokenMint as GameTokens]["wheel" as GameType] * minAmtFactor;

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
      const maxStrikeMultiplier = item.reduce(
        (acc, next) => Math.max(acc, next.multiplier),
        0,
      );
      const maxPayout = Decimal.mul(amount, maxStrikeMultiplier);

      if (!(maxPayout.toNumber() <= maxPayouts[tokenMint as GameTokens].wheel))
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
          .json({ success: false, message: "Insufficient balance !" });

      const account = user._id;

      let userData;
      if (wallet)
        userData = await StakingUser.findOneAndUpdate(
          { account },
          {},
          { upsert: true, new: true },
        );

      const stakeAmount = userData?.stakedAmount ?? 0;
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
              amountWon = Decimal.mul(amount, strikeMultiplier).mul(
                Decimal.sub(1, houseEdge),
              );
              amountLost = Math.max(
                Decimal.sub(amount, amountWon).toNumber(),
                0,
              );

              result = amountWon.toNumber() > amount ? "Won" : "Lost";

              feeGenerated = Decimal.mul(amount, strikeMultiplier)
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
            isWeb2User: tokenMint === "WEB2",
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
        wallet,
        GameType.wheel,
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

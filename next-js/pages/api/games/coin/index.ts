import connectDatabase from "../../../../utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { wsEndpoint } from "@/context/config";
import { Coin, GameSeed, User } from "@/models/games";
import {
  GameTokens,
  GameType,
  decryptServerSeed,
  generateGameResult,
  seedStatus,
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
  flipType: "heads" | "tails";
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, email, amount, tokenMint, flipType }: InputType = req.body;

      if (tokenMint !== "SUPER")
        return res
          .status(400)
          .json({ success: false, message: "Invalid token!" });

      const minGameAmount =
        maxPayouts[tokenMint as GameTokens]["coinflip" as GameType] *
        minAmtFactor;

      if (maintainance)
        return res.status(400).json({
          success: false,
          message: "Under maintenance",
        });

      if ((!wallet && !email) || !amount || !flipType || !tokenMint)
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
      const maxPayout = Decimal.mul(amount, strikeMultiplier);

      // if (
      //   !(maxPayout.toNumber() <= maxPayouts[tokenMint as GameTokens].coinflip)
      // )
      //   return res
      //     .status(400)
      //     .json({ success: false, message: "Max payout exceeded" });

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
        amountWon = Decimal.mul(amount, strikeMultiplier).mul(
          Decimal.sub(1, houseEdge),
        );
        amountLost = 0;

        feeGenerated = Decimal.mul(amount, strikeMultiplier)
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
            // $set: {
            // isWeb2User: tokenMint === "SUPER",
            // },
          },
          {
            new: true,
          },
        );
      } catch (e) {
        console.error(e);
      }

      console.log(userUpdate);

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
        wallet,
        email,
        GameType.coin,
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
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  } else
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
}

export default handler;

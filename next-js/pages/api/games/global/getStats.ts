import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import {
  Coin,
  Dice,
  Dice2,
  Keno,
  Limbo,
  Mines,
  Option,
  Plinko,
  Roulette1,
  Roulette2,
  Wheel,
} from "@/models/games";
import { GameType } from "@/utils/provably-fair";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      // Get the game type from the query
      const game = req.query.game as string;

      if (!Object.entries(GameType).some(([_, value]) => value === game))
        return res
          .status(400)
          .json({ success: false, message: "Invalid game type" });

      await connectDatabase();

      //count the unique wallets and aggregate amount field from Model
      let stats;
      switch (game) {
        case GameType.coin:
          stats = await Coin.aggregate([
            {
              $group: {
                _id: null,
                volume: { $sum: "$amount" },
                players: { $addToSet: "$wallet" },
              },
            },
            {
              $addFields: {
                players: { $size: "$players" },
              },
            },
          ]).then((res) => res[0]);
        case GameType.dice:
          stats = await Dice.aggregate([
            {
              $group: {
                _id: null,
                volume: { $sum: "$amount" },
                players: { $addToSet: "$wallet" },
              },
            },
            {
              $addFields: {
                players: { $size: "$players" },
              },
            },
          ]).then((res) => res[0]);
          break;
        case GameType.options:
          stats = await Option.aggregate([
            {
              $group: {
                _id: null,
                volume: { $sum: "$amount" },
                players: { $addToSet: "$wallet" },
              },
            },
            {
              $addFields: {
                players: { $size: "$players" },
              },
            },
          ]).then((res) => res[0]);
          break;
        case GameType.dice2:
          stats = await Dice2.aggregate([
            {
              $group: {
                _id: null,
                volume: { $sum: "$amount" },
                players: { $addToSet: "$wallet" },
              },
            },
            {
              $addFields: {
                players: { $size: "$players" },
              },
            },
          ]).then((res) => res[0]);
          break;
        case GameType.keno:
          stats = await Keno.aggregate([
            {
              $group: {
                _id: null,
                volume: { $sum: "$amount" },
                players: { $addToSet: "$wallet" },
              },
            },
            {
              $addFields: {
                players: { $size: "$players" },
              },
            },
          ]).then((res) => res[0]);
          break;
        case GameType.limbo:
          stats = await Limbo.aggregate([
            {
              $group: {
                _id: null,
                volume: { $sum: "$amount" },
                players: { $addToSet: "$wallet" },
              },
            },
            {
              $addFields: {
                players: { $size: "$players" },
              },
            },
          ]).then((res) => res[0]);
          break;
        case GameType.plinko:
          stats = await Plinko.aggregate([
            {
              $group: {
                _id: null,
                volume: { $sum: "$amount" },
                players: { $addToSet: "$wallet" },
              },
            },
            {
              $addFields: {
                players: { $size: "$players" },
              },
            },
          ]).then((res) => res[0]);
          break;
        case GameType.roulette1:
          stats = await Roulette1.aggregate([
            {
              $group: {
                _id: null,
                volume: { $sum: "$amount" },
                players: { $addToSet: "$wallet" },
              },
            },
            {
              $addFields: {
                players: { $size: "$players" },
              },
            },
          ]).then((res) => res[0]);
          break;
        case GameType.roulette2:
          stats = await Roulette2.aggregate([
            {
              $group: {
                _id: null,
                volume: { $sum: "$amount" },
                players: { $addToSet: "$wallet" },
              },
            },
            {
              $addFields: {
                players: { $size: "$players" },
              },
            },
          ]).then((res) => res[0]);
          break;
        case GameType.wheel:
          stats = await Wheel.aggregate([
            {
              $group: {
                _id: null,
                volume: { $sum: "$amount" },
                players: { $addToSet: "$wallet" },
              },
            },
            {
              $addFields: {
                players: { $size: "$players" },
              },
            },
          ]).then((res) => res[0]);
          break;
        case GameType.mines:
          stats = await Mines.aggregate([
            {
              $group: {
                _id: null,
                volume: { $sum: "$amount" },
                wallets: { $addToSet: "$wallet" },
              },
            },
            {
              $addFields: {
                players: { $size: "$wallets" },
              },
            },
          ]).then((res) => res[0]);
          break;
        case GameType.hilo:
          stats = await Mines.aggregate([
            {
              $group: {
                _id: null,
                volume: { $sum: "$amount" },
                wallets: { $addToSet: "$wallet" },
              },
            },
            {
              $addFields: {
                players: { $size: "$wallets" },
              },
            },
          ]).then((res) => res[0]);
          break;
      }

      return res.json({
        success: true,
        stats,
        message: `Data fetch successful !`,
      });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}

export default handler;

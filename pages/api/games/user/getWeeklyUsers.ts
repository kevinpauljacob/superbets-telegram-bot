import { Option, Coin, Dice, User } from "../../../../models/games";
import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";

async function binaryAggregateData(
  model: any,
  betAmountField: string,
  resultField: string,
  previousMonday: Date,
): Promise<
  { _id: string; total: number; won: number; lost: number; count: number }[]
> {
  const result = await model.aggregate([
    {
      $match: {
        updatedAt: { $gt: previousMonday },
      },
    },
    {
      $group: {
        _id: "$wallet",
        total: { $sum: `$${betAmountField}` },
        won: {
          $sum: {
            $cond: {
              if: { $eq: [`$${resultField}`, "Won"] },
              then: { $multiply: [`$${betAmountField}`, 0.7] },
              else: 0,
            },
          },
        },
        lost: {
          $sum: {
            $cond: {
              if: { $eq: [`$${resultField}`, "Lost"] },
              then: `$${betAmountField}`,
              else: 0,
            },
          },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  return result;
}

async function flipAggregateData(
  model: any,
  betAmountField: string,
  resultField: string,
  previousMonday: Date,
): Promise<
  { _id: string; total: number; won: number; lost: number; count: number }[]
> {
  const result = await model.aggregate([
    {
      $match: {
        updatedAt: { $gt: previousMonday },
      },
    },
    {
      $group: {
        _id: "$wallet",
        total: { $sum: `$${betAmountField}` },
        won: {
          $sum: {
            $cond: {
              if: { $eq: [`$${resultField}`, "Won"] },
              then: { $multiply: [`$${betAmountField}`, 0.985] },
              else: 0,
            },
          },
        },
        lost: {
          $sum: {
            $cond: {
              if: { $eq: [`$${resultField}`, "Lost"] },
              then: `$${betAmountField}`,
              else: 0,
            },
          },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  return result;
}

async function rollAggregateData(
  model: any,
  betAmountField: string,
  resultField: string,
  previousMonday: Date,
): Promise<
  { _id: string; total: number; won: number; lost: number; count: number }[]
> {
  const result = await model.aggregate([
    {
      $match: {
        updatedAt: { $gt: previousMonday },
      },
    },
    {
      $group: {
        _id: "$wallet",
        total: { $sum: `$${betAmountField}` },
        won: {
          $sum: {
            $cond: {
              if: { $eq: [`$${resultField}`, "Won"] },
              then: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: [{ $size: "$chosenNumbers" }, 5] },
                      then: { $multiply: ["$rollAmount", 0.182] },
                    },
                    {
                      case: { $eq: [{ $size: "$chosenNumbers" }, 4] },
                      then: { $multiply: ["$rollAmount", 0.4775] },
                    },
                    {
                      case: { $eq: [{ $size: "$chosenNumbers" }, 3] },
                      then: { $multiply: ["$rollAmount", 0.97] },
                    },
                    {
                      case: { $eq: [{ $size: "$chosenNumbers" }, 2] },
                      then: { $multiply: ["$rollAmount", 1.995] },
                    },
                    {
                      case: { $eq: [{ $size: "$chosenNumbers" }, 1] },
                      then: { $multiply: ["$rollAmount", 4.91] },
                    },
                  ],
                  default: { $multiply: ["$rollAmount", 0] },
                },
              },
              else: 0,
            },
          },
        },
        lost: {
          $sum: {
            $cond: {
              if: { $eq: [`$${resultField}`, "Lost"] },
              then: `$${betAmountField}`,
              else: 0,
            },
          },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  return result;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      await connectDatabase();

      // Calculate the previous Monday at 00:00 UTC
      const currentDate = new Date();
      const daysSinceMonday = (currentDate.getUTCDay() + 6) % 7; // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
      const previousMonday = new Date(currentDate);
      previousMonday.setUTCHours(0, 0, 0, 0);
      previousMonday.setUTCDate(currentDate.getUTCDate() - daysSinceMonday);

      const bets = await binaryAggregateData(
        Option,
        "betAmount",
        "result",
        previousMonday,
      );
      const flips = await flipAggregateData(
        Coin,
        "amount",
        "result",
        previousMonday,
      );
      const rolls = await rollAggregateData(
        Dice,
        "rollAmount",
        "result",
        previousMonday,
      );
      const users = await User.find({});

      const result: {
        wallet: string;
        bets: number;
        flips: number;
        rolls: number;
        total: number;
        won: number;
        lost: number;
        sns: string;
      }[] = [];

      bets.forEach((bet) => {
        result.push({
          wallet: bet._id,
          bets: bet.count,
          flips: 0,
          rolls: 0,
          total: bet.total,
          won: bet.won,
          lost: bet.lost,
          sns: users.find((data) => data.wallet == bet._id).sns,
        });
      });

      flips.forEach((flip) => {
        const index = result.findIndex((x) => x.wallet === flip._id);
        if (index === -1) {
          result.push({
            wallet: flip._id,
            bets: 0,
            flips: flip.count,
            rolls: 0,
            total: flip.total,
            won: flip.won,
            lost: flip.lost,
            sns: users.find((data) => data.wallet == flip._id).sns,
          });
        } else {
          result[index].flips = flip.count;
          result[index].total += flip.total;
          result[index].won += flip.won;
          result[index].lost += flip.lost;
        }
      });

      rolls.forEach((roll) => {
        const index = result.findIndex((x) => x.wallet === roll._id);
        if (index === -1) {
          result.push({
            wallet: roll._id,
            bets: 0,
            flips: 0,
            rolls: roll.count,
            total: roll.total,
            won: roll.won,
            lost: roll.lost,
            sns: users.find((data) => data.wallet == roll._id).sns,
          });
        } else {
          result[index].rolls = roll.count;
          result[index].total += roll.total;
          result[index].won += roll.won;
          result[index].lost += roll.lost;
        }
      });

      result.sort((a, b) => b.total - a.total);

      return res.json({
        success: true,
        data: result,
        message: `Data fetch successful !`,
      });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}

export default handler;

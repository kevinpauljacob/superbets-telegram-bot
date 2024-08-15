import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { Option, Coin, Dice, User } from "../../../../models/games";

/**
 * @swagger
 * /games/user/getAllUsers:
 *   get:
 *     summary: Get aggregated data for all users
 *     description: Retrieves aggregated data for users including bets, flips, and rolls with their respective totals, won amounts, lost amounts, and counts. Also includes user-specific information like SNS.
 *     tags:
 *       - Games/User
 *     parameters:
 *       - in: query
 *         name: slug
 *         schema:
 *           type: string
 *         description: The slug associated with your api key.
 *     responses:
 *       200:
 *         description: Data fetch successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       wallet:
 *                         type: string
 *                         example: "0x1234567890abcdef"
 *                       bets:
 *                         type: number
 *                         example: 10
 *                       flips:
 *                         type: number
 *                         example: 5
 *                       rolls:
 *                         type: number
 *                         example: 8
 *                       total:
 *                         type: number
 *                         example: 1000
 *                       won:
 *                         type: number
 *                         example: 700
 *                       lost:
 *                         type: number
 *                         example: 300
 *                       sns:
 *                         type: string
 *                         example: "SomeSNS"
 *                 message:
 *                   type: string
 *                   example: "Data fetch successful!"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error message details"
 */

async function binaryAggregateData(
  model: any,
  betAmountField: string,
  resultField: string,
): Promise<
  { _id: string; total: number; won: number; lost: number; count: number }[]
> {
  const result = await model.aggregate([
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
): Promise<
  { _id: string; total: number; won: number; lost: number; count: number }[]
> {
  const result = await model.aggregate([
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
): Promise<
  { _id: string; total: number; won: number; lost: number; count: number }[]
> {
  const result = await model.aggregate([
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

      // Calculate the previous Monday at 12:00 UTC

      const bets = await binaryAggregateData(Option, "amount", "result");
      const flips = await flipAggregateData(Coin, "amount", "result");
      const rolls = await rollAggregateData(Dice, "rollAmount", "result");
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

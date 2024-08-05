import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { GameStats, User } from "@/models/games";

/**
 * @swagger
 * tags:
 *  name: Games/Global
 *  description: Global game statistics and user data management
 */
/**
 * @swagger
 * /api/games/global/getAggStats:
 *   get:
 *     summary: Retrieves aggregated game statistics and total player count
 *     description: Fetches aggregated statistics from the `GameStats` collection and calculates the total volume for each game type. Also retrieves the total number of unique players from the `User` collection.
 *     tags:
 *      - Games/Global
 *     responses:
 *       200:
 *         description: Successful data retrieval
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalVolumes:
 *                       type: object
 *                       additionalProperties:
 *                         type: number
 *                       example: { "game1": 1000, "game2": 500 }
 *                     totalPlayers:
 *                       type: number
 *                       example: 1500
 *                 message:
 *                   type: string
 *                   example: "Data fetch successful!"
 *       500:
 *         description: Internal Server Error - Failed to fetch data
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
 *       405:
 *         description: Method Not Allowed - GET method required
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
 *                   example: "Method not allowed"
 */

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      await connectDatabase();

      const gameStats = await GameStats.find().lean();

      // Calculate the total volume and total unique players
      const totalVolumes: Record<string, number> = {};
      const totalPlayers = await User.countDocuments();

      gameStats.forEach((stat) => {
        Object.keys(stat.volume).forEach((key) => {
          if (totalVolumes[key]) {
            totalVolumes[key] += stat.volume[key];
          } else {
            totalVolumes[key] = stat.volume[key];
          }
        });
      });

      return res.json({
        success: true,
        stats: {
          totalVolumes,
          totalPlayers,
        },
        message: `Data fetch successful!`,
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

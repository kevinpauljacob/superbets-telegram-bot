import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { GameStats } from "@/models/games";
import { GameType } from "@/utils/provably-fair";

/**
 * @swagger
 * /games/global/getStats:
 *   get:
 *     summary: Retrieves statistics for a specific game type
 *     description: Fetches the statistics for a given game type. If the statistics do not exist, a new entry with default values is created.
 *     tags:
 *      - Games/Global
 *     parameters:
 *       - in: query
 *         name: slug
 *         schema:
 *           type: string
 *         description: The slug associated with your api key.
 *       - in: query
 *         name: game
 *         required: true
 *         schema:
 *           type: string
 *           example: "game_type_example"
 *         description: The type of game for which statistics are requested.
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
 *                     game:
 *                       type: string
 *                       example: "game_type_example"
 *                     volume:
 *                       type: object
 *                       additionalProperties:
 *                         type: number
 *                       example: {}
 *                     feeGenerated:
 *                       type: object
 *                       additionalProperties:
 *                         type: number
 *                       example: {}
 *                 message:
 *                   type: string
 *                   example: "Data fetch successful!"
 *       400:
 *         description: Bad Request - Invalid game type provided
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
 *                   example: "Invalid game type"
 *       500:
 *         description: Internal Server Error - Failed to fetch or create data
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
      // Get the game type from the query
      const game = req.query.game as string;

      if (!Object.entries(GameType).some(([_, value]) => value === game))
        return res
          .status(400)
          .json({ success: false, message: "Invalid game type" });

      await connectDatabase();

      let gameStats = await GameStats.findOne({ game }).lean();

      if (!gameStats)
        gameStats = await GameStats.create({
          game,
          volume: {},
          feeGenerated: {},
        });

      return res.json({
        success: true,
        stats: gameStats,
        message: `Data fetch successful !`,
      });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}

export default handler;

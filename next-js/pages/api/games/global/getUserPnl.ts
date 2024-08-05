import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { gameModelMap, User } from "@/models/games";
import { GameType, decryptServerSeed, seedStatus } from "@/utils/provably-fair";

/**
 * @swagger
 * /api/games/global/getUserPnl:
 *   get:
 *     summary: Calculates the profit and loss (PnL) for a specific user
 *     description: Computes the total profit and loss for a user based on their historical game records. Aggregates data from different game types and handles server seed decryption if needed.
 *     tags:
 *      - Games/Global
 *     parameters:
 *       - in: query
 *         name: wallet
 *         required: true
 *         schema:
 *           type: string
 *           example: "wallet_address_example"
 *         description: The wallet address of the user.
 *     responses:
 *       200:
 *         description: Successful PnL calculation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: number
 *                   example: 1234.56
 *                   description: The total profit and loss for the user.
 *                 message:
 *                   type: string
 *                   example: "Data fetch successful!"
 *       400:
 *         description: Bad Request - Missing or invalid wallet address
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
 *                   example: "Invalid wallet"
 *       500:
 *         description: Internal Server Error - Failed to fetch or process data
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

const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const wallet = req.query.wallet;

      if (!wallet)
        return res
          .status(400)
          .json({ success: false, message: "Invalid wallet" });

      await connectDatabase();

      const user = await User.findOne({ wallet });
      if (!user)
        return res.json({ success: true, data: [], message: "No data found" });

      const data: any[] = [];

      for (const [_, value] of Object.entries(GameType)) {
        const game = value;
        const model = gameModelMap[game as keyof typeof gameModelMap];

        if (game === GameType.options) {
          const records = await model.find({ wallet }).sort({ createdAt: -1 });

          const resultsWithGame = records.map((record) => {
            const { ...rest } = record.toObject();

            rest.game = game;
            return rest;
          });

          data.push(...resultsWithGame);
        } else {
          const records = await model
            .find({ wallet })
            .populate({
              path: "gameSeed",
            })
            .sort({ createdAt: -1 });

          const resultsWithGame = records.map((record) => {
            const { gameSeed, ...rest } = record.toObject();

            rest.game = game;

            if (gameSeed.status !== seedStatus.EXPIRED) {
              rest.gameSeed = { ...gameSeed, serverSeed: undefined };
            } else {
              const serverSeed = decryptServerSeed(
                gameSeed.serverSeed,
                encryptionKey,
                Buffer.from(gameSeed.iv, "hex"),
              );
              rest.gameSeed = { ...gameSeed, serverSeed };
            }

            return rest;
          });

          data.push(...resultsWithGame);
        }
      }

      data.sort((a: any, b: any) => {
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      let pnl = 0;

      for (let i = 0; i < data.length; i++) {
        if (data[i].result == "Lost") pnl -= data[i].amount;
        else pnl += data[i].amountWon - data[i].amount;
      }

      return res.json({
        success: true,
        data: pnl,
        message: `Data fetch successful !`,
      });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}

export default handler;

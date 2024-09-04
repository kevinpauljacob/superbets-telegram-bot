import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { GameType, decryptServerSeed, seedStatus } from "@/utils/provably-fair";
import StakingUser from "@/models/staking/user";
import { User, gameModelMap } from "@/models/games";

/**
 * @swagger
 * /games/global/getHistory:
 *   get:
 *     summary: Retrieves recent game history with user information
 *     description: Fetches the latest 20 game records for each game type, populates user names and tiers, and includes decrypted game seed details if applicable. Sorts the records by creation date in descending order.
 *     tags:
 *      - Games/Global
 *     parameters:
 *       - in: query
 *         name: slug
 *         schema:
 *           type: string
 *         description: The slug associated with your api key.
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
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       account:
 *                         type: string
 *                         example: "user_wallet_address"
 *                       game:
 *                         type: string
 *                         example: "game_type"
 *                       gameSeed:
 *                         type: object
 *                         properties:
 *                           serverSeed:
 *                             type: string
 *                             example: "decrypted_server_seed"
 *                           iv:
 *                             type: string
 *                             example: "initialization_vector"
 *                           status:
 *                             type: string
 *                             example: "ACTIVE"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-08-04T12:34:56Z"
 *                       userTier:
 *                         type: number
 *                         example: 1
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

const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      await connectDatabase();

      const data: any[] = [];

      for (const [_, value] of Object.entries(GameType)) {
        const game = value;
        const model = gameModelMap[game as keyof typeof gameModelMap];

        if (game === GameType.options) {
          const records = await model.find().sort({ createdAt: -1 }).limit(20);

          const resultsWithGame = await Promise.all(
            records.map(async (record) => {
              const { ...rest } = record.toObject();
              let user = await User.findById(rest.account);
              if (user) rest.account = user?.name ?? user?.wallet;
              rest.game = game;

              return rest;
            }),
          );

          data.push(...resultsWithGame);
        } else {
          const records = await model
            .find()
            .populate({
              path: "gameSeed",
            })
            .sort({ createdAt: -1 })
            .limit(20);

          const resultsWithGame = await Promise.all(
            records.map(async (record) => {
              const { gameSeed, ...rest } = record.toObject();
              let user = await User.findById(rest.account);
              if (user) rest.account = user?.name ?? user?.wallet;

              rest.game = game;

              if (gameSeed.status !== seedStatus.EXPIRED) {
                rest.gameSeed = {
                  ...gameSeed,
                  serverSeed: undefined,
                  _id: undefined,
                  iv: undefined,
                  pendingMines: undefined,
                  __v: undefined,
                  createdAt: undefined,
                  updatedAt: undefined,
                };
              } else {
                const serverSeed = decryptServerSeed(
                  gameSeed.serverSeed,
                  encryptionKey,
                  Buffer.from(gameSeed.iv, "hex"),
                );
                rest.gameSeed = {
                  ...gameSeed,
                  serverSeed,
                  _id: undefined,
                  iv: undefined,
                  pendingMines: undefined,
                  __v: undefined,
                  createdAt: undefined,
                  updatedAt: undefined,
                };
              }

              return rest;
            }),
          );

          data.push(...resultsWithGame);
        }
      }

      data.sort((a: any, b: any) => {
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      const wallets: string[] = Array.from(
        new Set(data.map((doc: any) => doc?.account)),
      );

      const userData = await StakingUser.find({
        wallet: { $in: wallets },
      }).select("wallet tier");

      const userTiers = userData.reduce((acc, user) => {
        acc[user.wallet] = user.tier;
        return acc;
      }, {});

      data.forEach((doc: any) => {
        doc.userTier = userTiers[doc.wallet] ?? 0;
      });

      return res.json({
        success: true,
        data,
        message: `Data fetch successful !`,
      });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}

export default handler;

import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { gameModelMap, User } from "@/models/games";
import { GameType, decryptServerSeed, seedStatus } from "@/utils/provably-fair";

/**
 * @swagger
 * /games/global/getUserHistory:
 *   get:
 *     summary: Retrieves historical game records for a specific user
 *     description: Fetches game records for a user based on either their wallet address or email. Includes game data and decrypts server seeds if necessary.
 *     tags:
 *      - Games/Global
 *     parameters:
 *       - in: query
 *         name: slug
 *         schema:
 *           type: string
 *         description: The slug associated with your api key.
 *       - in: query
 *         name: wallet
 *         required: false
 *         schema:
 *           type: string
 *           example: "wallet_address_example"
 *         description: The wallet address of the user.
 *       - in: query
 *         name: email
 *         required: false
 *         schema:
 *           type: string
 *           example: "user@example.com"
 *         description: The email address of the user.
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
 *                       game:
 *                         type: string
 *                       account:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       amountWon:
 *                         type: number
 *                       result:
 *                         type: string
 *                       tokenMint:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       gameSeed:
 *                         type: object
 *                         properties:
 *                           serverSeed:
 *                             type: string
 *                           iv:
 *                             type: string
 *                           status:
 *                             type: string
 *                 message:
 *                   type: string
 *                   example: "Data fetch successful!"
 *       400:
 *         description: Bad Request - Missing or invalid query parameters
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
 *                   example: "Invalid wallet or email"
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
      const wallet = req?.query?.wallet;
      const email = req?.query?.email;

      if (!wallet && !email)
        return res
          .status(400)
          .json({ success: false, message: "Invalid wallet" });

      await connectDatabase();

      let user: any = null;
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
        return res.json({ success: true, data: [], message: "No data found" });

      const account = user._id;
      const data: any[] = [];

      for (const [_, value] of Object.entries(GameType)) {
        const game = value;
        const model = gameModelMap[game as keyof typeof gameModelMap];

        if (game === GameType.options) {
          const records = await model
            .find({ account })
            .sort({ createdAt: -1 })
            .limit(30);

          const resultsWithGame = records.map((record) => {
            const { ...rest } = record.toObject();
            rest.account = user?.name ?? user?.wallet;
            rest.game = game;
            return rest;
          });

          data.push(...resultsWithGame);
        } else {
          const records = await model
            .find({ account })
            .populate({
              path: "gameSeed",
            })
            .sort({ createdAt: -1 })
            .limit(30);

          const resultsWithGame = records.map((record) => {
            const { gameSeed, ...rest } = record.toObject();
            rest.account = user?.name ?? user?.wallet;
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
          });

          data.push(...resultsWithGame);
        }
      }

      data.sort((a: any, b: any) => {
        return b.createdAt.getTime() - a.createdAt.getTime();
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

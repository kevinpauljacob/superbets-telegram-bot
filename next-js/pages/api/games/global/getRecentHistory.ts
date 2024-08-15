import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { gameModelMap, User } from "@/models/games";
import { GameType } from "@/utils/provably-fair";
import StakingUser from "@/models/staking/user";

/**
 * @swagger
 * /games/global/getRecentHistory:
 *   get:
 *     summary: Retrieves recent game history with "Won" results
 *     description: Fetches the most recent 10 game records with a "Won" result for each game type, including user names, amounts, and other details. Returns the top 15 most recent records sorted by creation date.
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
 *                       game:
 *                         type: string
 *                         example: "game_type"
 *                       account:
 *                         type: string
 *                         example: "user_name_or_wallet"
 *                       amount:
 *                         type: number
 *                         example: 100
 *                       amountWon:
 *                         type: number
 *                         example: 50
 *                       result:
 *                         type: string
 *                         example: "Won"
 *                       tokenMint:
 *                         type: string
 *                         example: "token_mint_address"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-08-04T12:34:56Z"
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

      const allGames: {
        game: GameType;
        account: any;
        amount: number;
        amountWon: number;
        result: string;
        tokenMint: string;
        createdAt: any;
      }[] = [];

      for (const [_, value] of Object.entries(GameType)) {
        const game = value;
        const model = gameModelMap[game as keyof typeof gameModelMap];

        const gameInfo = await Promise.all(
          (
            await model
              .find({ result: "Won" })
              .sort({ createdAt: -1 })
              .limit(10)
          ).map(async (record) => {
            const { account, amount, amountWon, result, createdAt, tokenMint } =
              record;

            let user = await User.findOne({ _id: account });

            return {
              game,
              account: user?.name ?? user?.wallet,
              amount,
              amountWon,
              result,
              tokenMint,
              createdAt,
            };
          }),
        );

        allGames.push(...gameInfo);
      }

      const sortedGames = allGames
        .sort((a: any, b: any) => {
          return b.createdAt.getTime() - a.createdAt.getTime();
        })
        .slice(0, 15);

      // const wallets = Array.from(
      //   new Set(sortedGames.map((doc: any) => doc.wallet)),
      // );

      // const userData = await StakingUser.find({
      //   wallet: { $in: wallets },
      // }).select("wallet tier");

      // const userTiers = userData.reduce((acc, user) => {
      //   acc[user.wallet] = user.tier;
      //   return acc;
      // }, {});

      // sortedGames.forEach((doc: any) => {
      //   doc.userTier = userTiers[doc.wallet] ?? 0;
      // });

      return res.json({
        success: true,
        data: sortedGames,
        message: `Data fetch successful !`,
      });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}

export default handler;

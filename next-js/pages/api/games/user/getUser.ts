import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import User from "../../../../models/games/gameUser";
import { SPL_TOKENS } from "@/context/config";
import Deposit from "@/models/games/deposit";

/**
 * @swagger
 * /games/user/getUser:
 *   get:
 *     summary: Get user data
 *     description: Retrieve user data based on wallet or email.
 *     tags:
 *       - Games/User
 *     parameters:
 *       - in: query
 *         name: wallet
 *         schema:
 *           type: string
 *           example: ABC1234XYZ5678
 *         required: false
 *         description: The wallet address of the user.
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *           example: user@example.com
 *         required: false
 *         description: The email address of the user.
 *     responses:
 *       200:
 *         description: User data fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d0fe4f5311236168a109ca
 *                     wallet:
 *                       type: string
 *                       example: ABC1234XYZ5678
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     image:
 *                       type: string
 *                       example: https://example.com/image.jpg
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     isWeb2User:
 *                       type: boolean
 *                       example: true
 *                     deposit:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           amount:
 *                             type: number
 *                             example: 100.0
 *                           tokenMint:
 *                             type: string
 *                             example: SUPER
 *                           tokenName:
 *                             type: string
 *                             example: Super Token
 *                           img:
 *                             type: string
 *                             example: https://example.com/super-token.png
 *                 message:
 *                   type: string
 *                   example: Data fetch successful !
 *       400:
 *         description: Missing parameters.
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
 *                   example: Missing parameters
 *       500:
 *         description: Internal server error.
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
 *                   example: An error occurred while fetching data.
 */
interface Deposit {
  amount: number;
  tokenMint: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      await connectDatabase();

      const wallet = req?.query?.wallet;
      const email = req?.query?.email;

      if (!wallet && !email)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      let user;
      if (wallet) user = await User.findOne({ wallet });
      else user = await User.findOne({ email });

      let deposit = [];
      if (user) {
        user = user.toObject();
        deposit = user.deposit.map((token: Deposit) => {
          let cd = SPL_TOKENS.find((c) => c.tokenMint === token.tokenMint)!;
          return {
            amount: token.amount,
            tokenMint: cd.tokenMint,
            tokenName: cd.tokenName,
            img: cd.icon,
          };
        });
      }

      return res.json({
        success: true,
        data: { ...user, deposit },
        message: `Data fetch successful !`,
      });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}

export default handler;

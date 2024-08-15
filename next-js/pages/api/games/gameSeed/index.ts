import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { GameSeed, User } from "@/models/games";
import {
  generateClientSeed,
  generateServerSeed,
  seedStatus,
} from "@/utils/provably-fair";

/**
 * @swagger
 * tags:
 *  name: Games/GameSeed
 *  description: Game seed management
 */
/**
 * @swagger
 * /games/gameSeed:
 *   post:
 *     summary: Generate and retrieve game seeds for a user
 *     description: Generates client and server seeds for a user based on their wallet or email, and returns the current and next game seed information.
 *     tags: [Games/GameSeed]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: User's email address
 *                 example: "user@example.com"
 *             anyOf:
 *               - required: [wallet]
 *               - required: [email]
 *     responses:
 *       201:
 *         description: Successfully created game seeds
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 activeGameSeed:
 *                   type: object
 *                   properties:
 *                     clientSeed:
 *                       type: string
 *                       example: "client-seed-example"
 *                     serverSeedHash:
 *                       type: string
 *                       example: "server-seed-hash-example"
 *                     iv:
 *                       type: string
 *                       example: "initialization-vector-example"
 *                 nextGameSeed:
 *                   type: object
 *                   properties:
 *                     clientSeed:
 *                       type: string
 *                       example: "client-seed-example"
 *                     serverSeedHash:
 *                       type: string
 *                       example: "server-seed-hash-example"
 *                     iv:
 *                       type: string
 *                       example: "initialization-vector-example"
 *       400:
 *         description: Bad Request due to missing parameters or user not found
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
 *                   example: "Missing parameters or User not found!"
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
 *       405:
 *         description: Method Not Allowed
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

const secret = process.env.NEXTAUTH_SECRET;
const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");

export const config = {
  maxDuration: 60,
};

type InputType = {
  wallet: string;
  email: string;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { email }: InputType = req.body;

      await connectDatabase();

      if (!email)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      let user = null;

      user = await User.findOne({
        email: email,
      });

      const account = user._id;

      if (!account || !user)
        return res
          .status(400)
          .json({ success: false, message: "User not found!" });

      const clientSeed = generateClientSeed();
      const serverSeedInfo1 = generateServerSeed(encryptionKey);
      const serverSeedInfo2 = generateServerSeed(encryptionKey);

      const activeGameSeed = await GameSeed.findOneAndUpdate(
        {
          account,
          status: seedStatus.ACTIVE,
        },
        {
          $setOnInsert: {
            clientSeed,
            serverSeed: serverSeedInfo1.encryptedServerSeed,
            serverSeedHash: serverSeedInfo1.serverSeedHash,
            iv: serverSeedInfo1.iv.toString("hex"),
          },
        },
        {
          projection: { serverSeed: 0 },
          upsert: true,
          new: true,
        },
      );

      if (!activeGameSeed) {
        throw new Error("Server hash not found!");
      }

      const nextGameSeed = await GameSeed.findOneAndUpdate(
        {
          account,
          status: seedStatus.NEXT,
        },
        {
          $setOnInsert: {
            clientSeed,
            serverSeed: serverSeedInfo2.encryptedServerSeed,
            serverSeedHash: serverSeedInfo2.serverSeedHash,
            iv: serverSeedInfo2.iv.toString("hex"),
          },
        },
        {
          projection: { serverSeed: 0 },
          upsert: true,
          new: true,
        },
      );

      return res.status(201).json({
        success: true,
        activeGameSeed,
        nextGameSeed,
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

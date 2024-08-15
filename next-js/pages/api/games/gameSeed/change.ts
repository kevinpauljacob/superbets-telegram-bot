import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { GameSeed, Hilo, Mines } from "@/models/games";
import { generateServerSeed, seedStatus } from "@/utils/provably-fair";

/**
 * @swagger
 * /games/gameSeed/change:
 *   post:
 *     summary: Change the game seed for a user
 *     description: Changes the current game seed to a new one for a user based on their account and client seed, and generates a new game seed for the next round. Checks for pending games before changing the seed.
 *     tags: [Games/GameSeed]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               account:
 *                 type: string
 *                 description: User's account identifier
 *                 example: "0x1234567890abcdef"
 *               clientSeed:
 *                 type: string
 *                 description: New client seed provided by the user
 *                 example: "new-client-seed-example"
 *             required:
 *               - account
 *               - clientSeed
 *     responses:
 *       201:
 *         description: Successfully changed game seed and generated new seed
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
 *                       example: "new-client-seed-example"
 *                     serverSeedHash:
 *                       type: string
 *                       example: "active-server-seed-hash-example"
 *                     iv:
 *                       type: string
 *                       example: "active-initialization-vector-example"
 *                 nextGameSeed:
 *                   type: object
 *                   properties:
 *                     serverSeedHash:
 *                       type: string
 *                       example: "next-server-seed-hash-example"
 *                     iv:
 *                       type: string
 *                       example: "next-initialization-vector-example"
 *       400:
 *         description: Bad Request due to missing or invalid parameters, or existing pending games
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
 *                   example: "Missing or invalid parameters"
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
  account: string;
  clientSeed: string;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const { account, clientSeed }: InputType = req.body;

    if (
      !account ||
      !clientSeed ||
      clientSeed.trim() === "" ||
      !/^[\x00-\x7F]*$/.test(clientSeed)
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing or invalid parameters",
      });
    }

    await connectDatabase();

    const pendingMines = await Mines.findOne({
      account,
      result: "Pending",
    });

    if (pendingMines) {
      return res.status(400).json({
        success: false,
        message: "Pending mines game!",
      });
    }

    // const pendingHilo = await Hilo.findOne({ wallet, result: "Pending" });
    // if (pendingHilo) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Pending hilo game!",
    //   });
    // }

    const expiredGameSeed = await GameSeed.findOneAndUpdate(
      {
        account,
        status: seedStatus.ACTIVE,
        pendingMines: false,
      },
      {
        $set: {
          status: seedStatus.EXPIRED,
        },
      },
      {
        new: true,
      },
    );

    if (!expiredGameSeed) {
      throw new Error("Server hash not found!");
    }

    const activeGameSeed = await GameSeed.findOneAndUpdate(
      {
        account,
        status: seedStatus.NEXT,
        pendingMines: false,
      },
      {
        $set: {
          clientSeed,
          status: seedStatus.ACTIVE,
        },
      },
      { projection: { serverSeed: 0 }, new: true },
    );

    const { encryptedServerSeed, serverSeedHash, iv } =
      generateServerSeed(encryptionKey);

    const nextGameSeed = await GameSeed.create([
      {
        account,
        serverSeed: encryptedServerSeed,
        serverSeedHash,
        iv: iv.toString("hex"),
      },
    ]).then((res) => res.at(0));

    let { serverSeed, ...rest } = nextGameSeed.toObject();

    return res.status(201).json({
      success: true,
      activeGameSeed,
      nextGameSeed: rest,
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
}

export default handler;

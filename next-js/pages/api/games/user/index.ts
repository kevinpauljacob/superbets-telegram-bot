import { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";
import { User } from "@/models/games";
import connectDatabase from "../../../../utils/database";
import authenticateUser from "../../../../utils/authenticate";
import { PublicKey, Keypair } from "@solana/web3.js";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import { encryptServerSeed, generateIV } from "@/utils/provably-fair";

/**
 * @swagger
 * tags:
 *  name: Games/User
 *  description: Game user management
 */
/**
 * @swagger
 * /games/user:
 *   post:
 *     summary: Create or update a game user
 *     description: This endpoint creates a new user or updates an existing user in the game database.
 *     tags:
 *       - Games/User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - wallet
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               name:
 *                 type: string
 *                 example: John Doe
 *               image:
 *                 type: string
 *                 example: https://example.com/image.jpg
 *               wallet:
 *                 type: string
 *                 example: ABC1234XYZ5678
 *     responses:
 *       201:
 *         description: User created or updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
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
 *                 message:
 *                   type: string
 *                   example: User created successfully!
 *       400:
 *         description: Bad request.
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
 *       405:
 *         description: Method not allowed.
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
 *                   example: Method not allowed
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }
  try {
    const { email, name, image } = req.body;

    await authenticateUser(req, res);

    await connectDatabase();

    const defaultDeposit = {
      amount: 100.0,
      tokenMint: "SUPER",
    };

    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Missing parameters" });

    let user: any = null;
    user = await User.findOne({
      email: email,
    });

    if (user) {
      user = await User.findOneAndUpdate(
        {
          $or: [{ email }],
        },
        {
          $set: {
            email,
            image,
          },
        },
        {
          new: true,
          upsert: true,
        },
      );
    } else {
      if (email) {
        const keyPair = Keypair.generate();
        console.log("Public Key:", keyPair.publicKey.toString());
        console.log("Secret Key:", keyPair.secretKey);

        const secretKey = bs58.encode(keyPair.secretKey);
        console.log(secretKey);
        const iv = generateIV();
        const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");
        const publicKey = keyPair.publicKey.toString();
        const privateKey = encryptServerSeed(secretKey, encryptionKey, iv);

        // const publicKey = "6NcvKXakC37oheNhRWdHYU8N1rYKtTyZaUktQC9U3aqP"
        // const privateKey = "5ce2e89f1e77d529d9525bf0afb93dd9e0ba275013a737cb5766be2179b58dc19f1b28cf6d6890e9bf777b001b88b47b8120df295a7a65f4aeb09cd5cb530a1b2f3d132379674497e0e9f66332bb5249ee1b3c0695ee9123abb9933dd995c000"

        user = await User.findOneAndUpdate(
          {
            email,
          },
          {
            $setOnInsert: {
              email,
              name,
              image,
              wallet: publicKey,
              privateKey,
              iv: iv.toString("hex"),
              isWeb2User: true,
              deposit: [defaultDeposit],
            },
          },
          {
            new: true,
            upsert: true,
          },
        );
      } else
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });
    }

    return res.status(201).json({
      success: true,
      user: {
        id: user?._id ?? null,
        wallet: user?.wallet ?? null,
        email: user?.email ?? null,
        image: user?.image ?? null,
        name: user?.name ?? null,
        isWeb2User: user?.isWeb2User ?? false,
        deposit: user?.deposit ?? [],
      },
      message: "User created successfully!",
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

import { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";
import { User } from "@/models/games";
import connectDatabase from "../../../../utils/database";
import authenticateUser from "../../../../utils/authenticate";
import { PublicKey, Keypair } from "@solana/web3.js";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import { encryptServerSeed, generateIV } from "@/utils/provably-fair";
import { faker } from "@faker-js/faker";

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
 *     description: This endpoint creates a new user in the game database.
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
 *     security:
 *       - API_KEY: []
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

    console.log("found user", user);

    if (!user) {
      if (email && name) {
        const keyPair = Keypair.generate();

        const secretKey = bs58.encode(keyPair.secretKey);
        // console.log(secretKey);
        const iv = generateIV();
        const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");
        const publicKey = keyPair.publicKey.toString();
        const privateKey = encryptServerSeed(secretKey, encryptionKey, iv);

        let userName = name;
        let existingUserWithName = await User.findOne({
          name: name,
        });

        while (existingUserWithName) {
          let options = {
            firstName: name.split(" ")[0],
            lastName: name.split(" ")[1] ?? "",
          };
          userName = faker.internet.userName(options);

          existingUserWithName = await User.findOne({ name: userName });
        }

        user = await User.findOneAndUpdate(
          {
            email,
          },
          {
            $setOnInsert: {
              email,
              name: userName,
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

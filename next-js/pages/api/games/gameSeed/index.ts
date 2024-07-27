import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { GameSeed, User } from "@/models/games";
import {
  generateClientSeed,
  generateServerSeed,
  seedStatus,
} from "@/utils/provably-fair";

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
      let { wallet, email }: InputType = req.body;

      await connectDatabase();

      if (!wallet && !email)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      let user = null;
      if (wallet) {
        user = await User.findOne({
          wallet: wallet,
        });
      } else if (email) {
        user = await User.findOne({
          email: email,
        });
      }

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

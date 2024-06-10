import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { GameSeed } from "@/models/games";
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
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet }: InputType = req.body;

      const token = await getToken({ req, secret });

      if (!token || !token.sub || token.sub != wallet)
        return res.status(400).json({
          success: false,
          message: "User wallet not authenticated",
        });

      await connectDatabase();

      if (!wallet)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      const clientSeed = generateClientSeed();
      const serverSeedInfo1 = generateServerSeed(encryptionKey);
      const serverSeedInfo2 = generateServerSeed(encryptionKey);

      const activeGameSeed = await GameSeed.findOneAndUpdate(
        {
          wallet,
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
          wallet,
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

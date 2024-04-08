import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { GameSeed } from "@/models/games";
import {
  generateClientSeed,
  generateServerSeed,
  seedStatus,
} from "@/utils/vrf";

const secret = process.env.NEXTAUTH_SECRET;

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
      const serverSeedInfo1 = generateServerSeed();
      const serverSeedInfo2 = generateServerSeed();

      const activeGameSeed = await GameSeed.findOneAndUpdate(
        {
          wallet,
          status: seedStatus.ACTIVE,
        },
        {
          $setOnInsert: {
            clientSeed,
            serverSeed: serverSeedInfo1.serverSeed,
            serverSeedHash: serverSeedInfo1.serverSeedHash,
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
            serverSeed: serverSeedInfo2.serverSeed,
            serverSeedHash: serverSeedInfo2.serverSeedHash,
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

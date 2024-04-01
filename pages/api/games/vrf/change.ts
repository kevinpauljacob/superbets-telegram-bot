import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { GameSeed } from "@/models/games";
import { generateServerSeed, seedStatus } from "@/utils/vrf";

const secret = process.env.NEXTAUTH_SECRET;

export const config = {
  maxDuration: 60,
};

type InputType = {
  wallet: string;
  clientSeed: string;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { wallet, clientSeed }: InputType = req.body;

      const token = await getToken({ req, secret });

      if (!token || !token.sub || token.sub != wallet)
        return res.status(400).json({
          success: false,
          message: "User wallet not authenticated",
        });

      await connectDatabase();

      if (!wallet || !clientSeed)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      const serverHashInfo = await GameSeed.findOneAndUpdate(
        {
          wallet,
          status: seedStatus.ACTIVE,
        },
        {
          $set: {
            status: seedStatus.EXPIRED,
          },
        },
        { new: true },
      );

      if (!serverHashInfo) {
        throw new Error("Server hash not found!");
      }

      await GameSeed.findOneAndUpdate(
        {
          wallet,
          status: seedStatus.NEXT,
        },
        {
          $set: {
            clientSeed,
            status: seedStatus.ACTIVE,
          },
        },
        { new: true },
      );

      const newServerHash = generateServerSeed();

      await GameSeed.create({
        wallet,
        serverSeed: newServerHash.serverSeed,
        serverSeedHash: newServerHash.serverSeedHash,
      });

      return res.status(201).json({
        success: true,
        newserverSeedHash: newServerHash.serverSeedHash,
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

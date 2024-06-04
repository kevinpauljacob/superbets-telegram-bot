import connectDatabase from "@/utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { GameSeed, User } from "@/models/games";
import {
  encryptServerSeed,
  generateClientSeed,
  generateIV,
  generateServerSeed,
  seedStatus,
} from "@/utils/provably-fair";

const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      return res
        .status(400)
        .json({ success: false, message: "This endpoint is disabled" });
      await connectDatabase();

      const result = await GameSeed.find();

      console.log(result.length);

      for (let i = 0; i < result.length; i++) {
        console.log("count", i);

        if (result[i].iv) continue;

        const iv = generateIV();

        const serverSeed = encryptServerSeed(
          result[i].serverSeed,
          encryptionKey,
          iv,
        );

        result[i].iv = iv.toString("hex");
        result[i].serverSeed = serverSeed;
        await result[i].save();
      }

      return res.json({ success: true });
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

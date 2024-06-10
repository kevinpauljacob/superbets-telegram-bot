import connectDatabase from "@/utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { GameSeed, User } from "@/models/games";
import {
  generateClientSeed,
  generateServerSeed,
  seedStatus,
} from "@/utils/provably-fair";

const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      //TODO: Check if there are games in pending status, don't execute this api without this change
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed" });

      await connectDatabase();

      const result = await User.aggregate([
        {
          $project: {
            wallet: 1,
          },
        },
      ]);

      const wallets = result.map((item) => item.wallet);

      console.log("wallets", wallets);

      for (let i = 0; i < wallets.length; i++) {
        console.log("count", i);
        const clientSeed = generateClientSeed();
        const wallet = wallets[i];

        const expiredGameSeed = await GameSeed.findOneAndUpdate(
          {
            wallet,
            status: seedStatus.ACTIVE,
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
          if (
            await GameSeed.findOne({
              wallet,
            })
          )
            throw new Error("Server hash not found!");
          else continue;
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
          { projection: { serverSeed: 0 }, new: true },
        );

        const { encryptedServerSeed, serverSeedHash, iv } =
          generateServerSeed(encryptionKey);

        await GameSeed.create({
          wallet,
          serverSeed: encryptedServerSeed,
          serverSeedHash,
          iv: iv.toString("hex"),
        });
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

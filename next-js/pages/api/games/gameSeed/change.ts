import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { GameSeed, Hilo, Mines } from "@/models/games";
import { generateServerSeed, seedStatus } from "@/utils/provably-fair";

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

      if (
        !wallet ||
        !clientSeed ||
        clientSeed.trim() === "" ||
        !/^[\x00-\x7F]*$/.test(clientSeed)
      ) {
        return res
          .status(400)
          .json({ success: false, message: "Missing or invalid parameters" });
      }

      // const pendingMines = await Mines.findOne({ wallet, result: "Pending" });
      // if (pendingMines)
      //   return res
      //     .status(400)
      //     .json({ success: false, message: "Pending mines game" });

      // const pendingHilo = await Hilo.findOne({ wallet, result: "Pending" });
      // if (pendingHilo)
      //   return res
      //     .status(400)
      //     .json({ success: false, message: "Pending hilo game" });

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
        throw new Error("Server hash not found!");
      }

      const activeGameSeed = await GameSeed.findOneAndUpdate(
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

      const newServerHash = generateServerSeed();

      const nextGameSeed = await GameSeed.create({
        wallet,
        serverSeed: newServerHash.serverSeed,
        serverSeedHash: newServerHash.serverSeedHash,
      });

      let { serverSeed, ...rest } = nextGameSeed;

      return res.status(201).json({
        success: true,
        activeGameSeed,
        nextGameSeed: rest,
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

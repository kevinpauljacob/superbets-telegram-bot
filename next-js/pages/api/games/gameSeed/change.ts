import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { GameSeed, Hilo, Mines } from "@/models/games";
import { generateServerSeed, seedStatus } from "@/utils/provably-fair";
import mongoose from "mongoose";

const secret = process.env.NEXTAUTH_SECRET;
const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");

export const config = {
  maxDuration: 60,
};

type InputType = {
  wallet: string;
  clientSeed: string;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const { wallet, clientSeed }: InputType = req.body;

    const token = await getToken({ req, secret });

    if (!token || !token.sub || token.sub !== wallet) {
      return res.status(400).json({
        success: false,
        message: "User wallet not authenticated",
      });
    }

    if (
      !wallet ||
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

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const pendingMines = await Mines.findOne({
        wallet,
        result: "Pending",
      }).session(session);

      if (pendingMines) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: "Pending mines game!",
        });
      }

      // const pendingHilo = await Hilo.findOne({ wallet, result: "Pending" }).session(session);
      // if (pendingHilo) {
      //   await session.abortTransaction();
      //   session.endSession();
      //   return res.status(400).json({
      //     success: false,
      //     message: "Pending hilo game!",
      //   });
      // }

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
          session,
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
        { projection: { serverSeed: 0 }, new: true, session },
      );

      const { encryptedServerSeed, serverSeedHash, iv } =
        generateServerSeed(encryptionKey);

      const nextGameSeed = await GameSeed.create(
        [
          {
            wallet,
            serverSeed: encryptedServerSeed,
            serverSeedHash,
            iv: iv.toString("hex"),
          },
        ],
        { session },
      ).then((res) => res.at(0));

      await session.commitTransaction();
      session.endSession();

      let { serverSeed, ...rest } = nextGameSeed.toObject();

      return res.status(201).json({
        success: true,
        activeGameSeed,
        nextGameSeed: rest,
      });
    } catch (error: any) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({ success: false, message: error.message });
    }
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
}

export default handler;

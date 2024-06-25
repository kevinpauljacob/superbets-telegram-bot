import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { GameSeed, Hilo, Mines } from "@/models/games";
import { generateServerSeed, seedStatus } from "@/utils/provably-fair";

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

    const pendingMines = await Mines.findOne({
      wallet,
      result: "Pending",
    });

    if (pendingMines) {
      return res.status(400).json({
        success: false,
        message: "Pending mines game!",
      });
    }

    // const pendingHilo = await Hilo.findOne({ wallet, result: "Pending" });
    // if (pendingHilo) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Pending hilo game!",
    //   });
    // }

    const expiredGameSeed = await GameSeed.findOneAndUpdate(
      {
        wallet,
        status: seedStatus.ACTIVE,
        pendingMines: false,
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
        pendingMines: false,
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

    const nextGameSeed = await GameSeed.create([
      {
        wallet,
        serverSeed: encryptedServerSeed,
        serverSeedHash,
        iv: iv.toString("hex"),
      },
    ]).then((res) => res.at(0));

    let { serverSeed, ...rest } = nextGameSeed.toObject();

    return res.status(201).json({
      success: true,
      activeGameSeed,
      nextGameSeed: rest,
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
}

export default handler;

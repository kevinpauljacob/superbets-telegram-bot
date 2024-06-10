import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { Mines } from "@/models/games";

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

      if (!wallet)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      await connectDatabase();

      const pendingGame = await Mines.findOne({ wallet, result: "Pending" });
      const result = pendingGame !== null ? true : false;

      return res.status(201).json({
        success: true,
        pendingGame,
        result,
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

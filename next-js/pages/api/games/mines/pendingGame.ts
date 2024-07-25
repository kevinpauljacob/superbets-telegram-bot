import connectDatabase from "@/utils/database";
import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { Mines, User } from "@/models/games";
import { maintainance } from "@/context/config";

const secret = process.env.NEXTAUTH_SECRET;

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

      if (maintainance)
        return res.status(400).json({
          success: false,
          message: "Under maintenance",
        });

      const token = await getToken({ req, secret });

      if (
        !token ||
        !token.sub ||
        (wallet && token.sub != wallet) ||
        (email && token.email !== email)
      )
        return res.status(400).json({
          success: false,
          message: "User not authenticated",
        });

      if (!wallet && !email)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      await connectDatabase();

      let user = await User.findOne({
        $or: [{ wallet: wallet }, { email: email }],
      });

      if (!user)
        return res
          .status(400)
          .json({ success: false, message: "User does not exist!" });

      const account = user._id;

      const pendingGame = await Mines.findOne({
        account, 
        result: "Pending",
      });
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

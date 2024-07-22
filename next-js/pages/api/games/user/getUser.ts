import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import User from "../../../../models/games/gameUser";
import { SPL_TOKENS } from "@/context/config";
import Deposit from "@/models/games/deposit";

interface Deposit {
  amount: number;
  tokenMint: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      await connectDatabase();

      const wallet = req?.query?.wallet;
      const email = req?.query?.email;

      if (!wallet && !email)
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });

      let user;
      if (wallet) user = await User.findOne({ wallet });
      else user = await User.findOne({ email });

      let deposit = [];
      if (user) {
        user = user.toObject();
        deposit = user.deposit.map((token: Deposit) => {
          let cd = SPL_TOKENS.find((c) => c.tokenMint === token.tokenMint)!;
          return {
            amount: token.amount,
            tokenMint: cd.tokenMint,
            tokenName: cd.tokenName,
            img: cd.icon,
          };
        });
      }

      return res.json({
        success: true,
        data: { ...user, deposit },
        message: `Data fetch successful !`,
      });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}

export default handler;

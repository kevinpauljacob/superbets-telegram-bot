import connectDatabase from "../../../../utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import User from "../../../../models/games/gameUser";
import { SPL_TOKENS } from "@/context/config";
import Deposit from "@/models/games/deposit";

interface Deposit {
  amount: number;
  tokenMint: string; //this is token name, i.e SOL, USDC, FOMO etc
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      await connectDatabase();
      // const { searchParams } = req.nextUrl;
      // const wallet = searchParams.get("wallet");

      const wallet = req.query.wallet;

      let user = await User.findOne({ wallet });

      let deposit = [];
      if (user)
        deposit = user.deposit.map((token: Deposit) => {
          let cd = SPL_TOKENS.find((c) => c.tokenMint === token.tokenMint)!;
          return {
            amount: token.amount,
            tokenMint: cd.tokenMint,
            tokenName: cd.tokenName,
            img: cd.icon,
          };
        });

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

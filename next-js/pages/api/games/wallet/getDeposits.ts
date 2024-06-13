import connectDatabase from "../../../../utils/database";
import Deposit from "../../../../models/games/deposit";
import { NextApiRequest, NextApiResponse } from "next";
import { SPL_TOKENS } from "@/context/config";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const wallet = req.query.wallet;

      if (!wallet)
        return res
          .status(400)
          .json({ success: false, message: "Wallet is required !" });

      await connectDatabase();

      let deposits = await Deposit.find(
        { wallet },
        {},
        { sort: { createdAt: -1 } },
      ).then((deposits) => {
        return deposits.map((deposit: any) => {
          const { tokenMint, ...rest } = deposit.toObject();
          const tokenName = SPL_TOKENS.find(
            (t) => t.tokenMint === deposit.tokenMint,
          )?.tokenName;

          return { tokenName, ...rest };
        });
      });

      return res.json({
        success: true,
        data: deposits,
        message: `Data fetch successful !`,
      });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  } else
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
}

export default handler;

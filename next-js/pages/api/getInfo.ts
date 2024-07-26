import connectDatabase from "@/utils/database";
import user from "@/models/staking/user";
import GameUser from "@/models/games/gameUser";
import { User } from "@/context/transactions";
import { NextApiRequest, NextApiResponse } from "next";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const { option } = req.body;
      if (!option)
        return res
          .status(400)
          .json({ success: false, message: "Missing paramters" });

      await connectDatabase();

      switch (option) {
        // 1 - get User details
        case 1: {
          const { wallet, email } = req.body;
          if (!wallet)
            return res
              .status(400)
              .json({ success: false, message: "Missing paramters" });

          const userInfo = await user.findOne({
            $or: [{ wallet: wallet }, { email: email }],
          });

          if (!userInfo)
            return res.json({
              success: true,
              user: null,
              message: "User not found",
            });

          return res.json({
            success: true,
            user: userInfo,
            message: "User found",
          });
        }
        // 2 - get leaderboard
        case 2: {
          let usersInfo: User[] | null = await user.find().sort({ points: -1 });

          if (!usersInfo)
            return res.status(400).json({
              success: false,
              message: "Unable to fetch data.",
            });

          return res.json({ success: true, users: usersInfo });
        }
        //global info
        case 3: {
          let globalInfo = await user.aggregate([
            {
              $group: {
                _id: null,
                totalVolume: { $sum: "$solAmount" },
                users: { $sum: 1 },
                stakedTotal: { $sum: "$stakedAmount" },
              },
            },
          ]);

          if (!globalInfo)
            return res.status(400).json({
              success: false,
              message: "Unable to fetch data.",
            });

          return res.json({
            success: true,
            data: globalInfo[0],
          });
        }
        // get web2 user leaderboard
        case 4: {
          let usersInfo = await GameUser.aggregate([
            { $match: { isWeb2User: true } },
            { $unwind: "$deposit" },
            { $match: { "deposit.tokenMint": "WEB2" } },
            { $sort: { "deposit.amount": -1 } },
          ]);

          if (!usersInfo || usersInfo.length === 0) {
            return res.status(400).json({
              success: false,
              message: "Unable to fetch data.",
            });
          }

          return res.json({ success: true, users: usersInfo });
        }
        default:
          return res
            .status(400)
            .json({ success: false, message: "Invalid option" });
      }
    } catch (err: any) {
      console.log(err);
      return res.status(500).json({ success: false, message: err.message });
    }
  } else {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }
}

export default handler;
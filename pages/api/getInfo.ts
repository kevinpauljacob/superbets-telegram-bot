import connectDatabase from "@/utils/database";
import user from "@/models/user";
import { User } from "@/context/transactions";
import { userInfo } from "os";

async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
    return res.status(200).end();
  }

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
          const { wallet } = req.body;
          if (!wallet)
            return res
              .status(400)
              .json({ success: false, message: "Missing paramters" });

          const userInfo = await user.findOne({ wallet: wallet });

          if (!userInfo)
            return res.json({
              success: false,
              message: "User not found",
            });

          return res.json({ success: true, user: userInfo });
        }
        // 2 - get leaderboard
        case 2: {
          const { wallet } = req.body;
          if (!wallet)
            return res
              .status(400)
              .json({ success: false, message: "Missing paramters" });

          let usersInfo : User[] | null = await user.findOne({});

          if (!usersInfo)
            return res.json({
              success: false,
              message: "Unable to fetch data.",
            });

          usersInfo = usersInfo.map((user) => {
            return {
              ...user,
              points: 1.2*(user.keys ?? 0)*(user.solAmount ?? 0)
            }
          }).sort((a, b) =>  a.points - b.points)

          return res.json({ success: true, user: usersInfo });
        }
        default:
          return res.json({ success: false, message: "Invalid option" });
      }
    } catch (err: any) {
      console.log(err);
      return res.json({ success: false, message: err.message });
    }
  }
}

export default handler;

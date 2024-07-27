import { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";
import User from "../../../../models/games/gameUser";
import connectDatabase from "../../../../utils/database";
import authenticateUser from "../../../../utils/authenticate";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }
  try {
    const { email, name, image, wallet } = req.body;

    await authenticateUser(req, res);

    await connectDatabase();

    let user: any = null;

    console.log(email, wallet);

    if (!email && !wallet)
      return res
        .status(400)
        .json({ success: false, message: "Missing parameters" });

    const defaultDeposit = {
      amount: 100,
      tokenMint: "SUPER",
    };

    if (email && wallet) {
      user = await User.findOneAndUpdate(
        {
          $or: [{ email }, { wallet }],
        },
        {
          $set: {
            email,
            name,
            image,
            wallet,
          },
          $setOnInsert: {
            deposit: [defaultDeposit],
          },
        },
        {
          new: true,
          upsert: true,
        },
      );
    } else {
      if (email) {
        user = await User.findOneAndUpdate(
          {
            email,
          },
          {
            $setOnInsert: {
              email,
              name,
              image,
              isWeb2User: true,
              deposit: [defaultDeposit],
            },
          },
          {
            new: true,
            upsert: true,
          },
        );
      } else if (wallet) {
        user = await User.findOneAndUpdate(
          {
            wallet,
          },
          {
            $setOnInsert: {
              wallet,
              isWeb2User: true,
              deposit: [defaultDeposit],
            },
          },
          {
            new: true,
            upsert: true,
          },
        );
      } else
        return res
          .status(400)
          .json({ success: false, message: "Missing parameters" });
    }

    return res.status(201).json({
      success: true,
      user: {
        id: user?._id ?? null,
        wallet: user?.wallet ?? null,
        email: user?.email ?? null,
        image: user?.image ?? null,
        name: user?.name ?? null,
        isWeb2User: user?.isWeb2User ?? false,
        deposit: user?.deposit ?? [],
      },
      message: "User created successfully!",
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

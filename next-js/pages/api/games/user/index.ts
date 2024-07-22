import { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";
import User from "../../../../models/games/gameUser";
import connectDatabase from "../../../../utils/database";
import { authenticateUser } from "@/utils/authenticate";

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
    const { email, name, image, wallet, emailSub } = req.body;

    await authenticateUser(req, res);

    await connectDatabase();

    let user;

    if (email) user = await User.findOne({ email });
    else if (wallet) user = await User.findOne({ wallet });

    if (user && user.twitterId && user.wallet)
      return res.status(200).json({
        success: true,
        user: {
          wallet: user?.wallet ?? null,
          email: user?.email ?? null,
          image: user?.image ?? null,
          name: user?.name ?? null,
          isWeb2User: user?.isWeb2User ?? false,
        },
        message: "User found.",
      });

    if (user) {
      if (email && !user.email) {
        user.email = email;
        user.name = name;
        user.image = image;
        await user.save();

        return res.status(200).json({
          success: true,
          user: {
            wallet: user?.wallet ?? null,
            email: user?.email ?? null,
            image: user?.image ?? null,
            name: user?.name ?? null,
            isWeb2User: user?.isWeb2User ?? false,
          },
          message: "Google connected successfully!",
        });
      } else if (wallet && !user.wallet) {
        user.wallet = wallet;
        await user.save();

        return res.status(200).json({
          success: true,
          user: {
            wallet: user?.wallet ?? null,
            email: user?.email ?? null,
            image: user?.image ?? null,
            name: user?.name ?? null,
            isWeb2User: user?.isWeb2User ?? false,
          },
          message: "Wallet connected successfully!",
        });
      }
    } else {
      // Create new user if not found
      if (email) {
        try {
          user = await User.create({
            email,
            name,
            image,
          });
        } catch (e) {
          console.error(e);
        }
      } else {
        user = await User.create({
          wallet,
        });
      }
    }
    return res.status(201).json({
      success: true,
      user: {
        wallet: user?.wallet ?? null,
        email: user?.email ?? null,
        image: user?.image ?? null,
        name: user?.name ?? null,
        isWeb2User: user?.isWeb2User ?? false,
      },
      message: "User created successfully!",
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

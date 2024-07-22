import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";

export const authenticateUser = async (
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  const secret = process.env.NEXTAUTH_SECRET;
  const { wallet, emailSub } = req.body;
  if (!emailSub && !wallet)
    return res
      .status(400)
      .json({ success: false, message: "Missing required parameters" });
  const token = await getToken({ req, secret });
  console.log("In auth", token)
  if (
    !token ||
    !token.sub ||
    (emailSub && token.sub != emailSub) ||
    (wallet && token.sub != wallet)
  )
    return res.status(400).json({
      success: false,
      message: "User wallet not authenticated",
    });
};

import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";

const authenticateUser = async (req: NextApiRequest, res: NextApiResponse) => {
  const secret = process.env.NEXTAUTH_SECRET;
  const { wallet, email } = req.body;
  if (!email && !wallet)
    return res
      .status(400)
      .json({ success: false, message: "Missing required parameters" });
  const token = await getToken({ req, secret });
  console.log("In auth", token);
  if (
    !token ||
    !token.sub ||
    //@ts-ignore
    (email && token?.user?.email != email) ||
    //@ts-ignore
    (wallet && token?.user?.wallet != wallet)
  )
    return res.status(400).json({
      success: false,
      message: "User wallet not authenticated",
    });
};

export default authenticateUser;

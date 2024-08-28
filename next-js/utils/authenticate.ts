import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";

const authenticateUser = async (req: NextApiRequest, res: NextApiResponse) => {
  const secret = process.env.NEXTAUTH_SECRET;
  const { email, account } = req.body;
  if (!email && !account)
    return res
      .status(400)
      .json({ success: false, message: "Missing required parameters" });
  const token = await getToken({ req, secret });
  if (
    !token ||
    !token.sub ||
    //@ts-ignore
    (email && token?.user?.email != email)||
    //@ts-ignore
    (account && token?.user?.id != account)
  )
    return res.status(400).json({
      success: false,
      message: "User wallet not authenticated",
    });
};

export default authenticateUser;

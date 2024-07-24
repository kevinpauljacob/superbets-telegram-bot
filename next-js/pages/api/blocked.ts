import type { NextApiRequest, NextApiResponse } from "next";

export default function handle(_req: NextApiRequest, res: NextApiResponse) {
  res.status(429).json({ message: "The request has been rate limited." });
  res.end();
}

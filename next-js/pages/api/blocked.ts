import type { NextApiRequest, NextApiResponse } from "next";

/**
 * @swagger
 * /api/blocked:
 *   get:
 *     summary: Rate limit response
 *     description: Responds with a message indicating that the request has been rate limited.
 *     tags:
 *       - Rate Limiting
 *     responses:
 *       429:
 *         description: The request has been rate limited.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: The request has been rate limited.
 */

export default function handle(_req: NextApiRequest, res: NextApiResponse) {
  res.status(429).json({ message: "The request has been rate limited." });
  res.end();
}

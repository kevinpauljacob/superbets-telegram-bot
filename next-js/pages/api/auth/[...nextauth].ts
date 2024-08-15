import { validateAuthTx } from "@/utils/signinMessage";
import { Transaction } from "@solana/web3.js";
import { NextApiRequest, NextApiResponse } from "next";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider, { GoogleProfile } from "next-auth/providers/google";
import { getCsrfToken } from "next-auth/react";
import { encode, getToken } from "next-auth/jwt";
import { User } from "@/models/games";

// /**
//  * @swagger
//  * tags:
//  *   name: Auth
//  *   description: Authentication related endpoints
//  */

// /**
//  * @swagger
//  * /auth/{...nextauth}:
//  *   get:
//  *     summary: Handles authentication requests
//  *     description: Handles authentication for users using NextAuth.js. Supports Google OAuth and Solana wallet authentication.
//  *     tags:
//  *      - Auth
//  *     responses:
//  *       200:
//  *         description: Successful authentication
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: true
//  *                 user:
//  *                   type: object
//  *                   properties:
//  *                     id:
//  *                       type: string
//  *                     email:
//  *                       type: string
//  *                     name:
//  *                       type: string
//  *                     image:
//  *                       type: string
//  *       401:
//  *         description: Unauthorized - Invalid credentials or authentication failure
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: false
//  *                 message:
//  *                   type: string
//  *                   example: "Invalid credentials"
//  *       500:
//  *         description: Internal Server Error - Failed to process request
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: false
//  *                 message:
//  *                   type: string
//  *                   example: "Error message details"
//  */

// /**
//  * @swagger
//  * /auth/{...nextauth}:
//  *   post:
//  *     summary: Handles authentication requests
//  *     description: Handles authentication for users using NextAuth.js. Supports Google OAuth and Solana wallet authentication.
//  *     tags:
//  *       - Auth
//  *     requestBody:
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               nonce:
//  *                 type: string
//  *                 example: "random-nonce-value"
//  *               txn:
//  *                 type: string
//  *                 example: "base64-encoded-transaction"
//  *     responses:
//  *       200:
//  *         description: Successful authentication
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: true
//  *                 user:
//  *                   type: object
//  *                   properties:
//  *                     id:
//  *                       type: string
//  *                     email:
//  *                       type: string
//  *                     name:
//  *                       type: string
//  *                     image:
//  *                       type: string
//  *       400:
//  *         description: Bad Request - Missing or invalid parameters
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: false
//  *                 message:
//  *                   type: string
//  *                   example: "Missing or invalid parameters"
//  *       401:
//  *         description: Unauthorized - Invalid credentials or authentication failure
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: false
//  *                 message:
//  *                   type: string
//  *                   example: "Invalid credentials"
//  *       500:
//  *         description: Internal Server Error - Failed to process request
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: false
//  *                 message:
//  *                   type: string
//  *                   example: "Error message details"
//  */

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret) throw new Error("Next auth secret is not set");

  const providers = [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile: async (profile: GoogleProfile) => {
        const token = await getToken({ req, secret });

        return {
          ...(token?.user || {}),
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          image: profile.picture,
          auth: "google",
        };
      },
    }),
  ];

  // const isDefaultSigninPage =
  //   req.method === "GET" && req.query.nextauth?.includes("signin");

  // // Hides Sign-In with Solana from the default sign page
  // if (isDefaultSigninPage) {
  //   providers.pop();
  // }

  return await NextAuth(req, res, {
    providers,
    session: {
      strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
      jwt: async ({ token, user, trigger }) => {
        user && (token.user = user);
        const rawToken = await encode({ token, secret });
        const response = await fetch(`${baseUrl}/api/games/user`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${rawToken}`,
          },
          body: JSON.stringify({
            //@ts-ignore
            wallet: token?.user?.wallet ?? null,
            //@ts-ignore
            email: token?.user?.email ?? null,
            //@ts-ignore
            name: token?.user?.name ?? null,
            //@ts-ignore
            image: token?.user?.image ?? null,
          }),
        });

        const data = await response.json();
        console.log("Data", data)
        if (data?.success && data?.user) {
          token.user = data?.user;
          return token;
        } else {
          throw new Error("Failed to create or update user");
        }
      },
      async session({ session, token }) {
        //@ts-ignore
        session.user = { ...token?.user, id: null };
        return session;
      },
    },
  });
}

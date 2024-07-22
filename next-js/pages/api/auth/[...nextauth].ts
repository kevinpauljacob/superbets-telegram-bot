import { validateAuthTx } from "@/utils/signinMessage";
import { Transaction } from "@solana/web3.js";
import { NextApiRequest, NextApiResponse } from "next";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider, { GoogleProfile } from "next-auth/providers/google";
import { getCsrfToken } from "next-auth/react";
import { encode } from "next-auth/jwt";

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret) throw new Error("Next auth secret is not set");

  const providers = [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile: async (profile: GoogleProfile) => {
        console.log("Profile: ", profile);

        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          image: profile.picture,
          auth: "google",
        };
      },
    }),
    CredentialsProvider({
      name: "Solana",
      credentials: {
        nonce: {
          label: "Nonce",
          type: "text",
        },
        txn: {
          label: "Transaction",
          type: "text",
        },
      },
      async authorize(credentials, req) {
        try {
          const signedTx = Transaction.from(
            Buffer.from(credentials?.txn as any, "base64"),
          );

          const csrfToken = await getCsrfToken({ req: { ...req, body: null } });

          if (credentials?.nonce !== csrfToken) {
            return null;
          }

          const validationResult = validateAuthTx(
            signedTx,
            credentials?.nonce!,
          );

          if (!validationResult)
            throw new Error("Could not validate the signed message");

          const wallet = signedTx.feePayer?.toBase58();

          if (!wallet) throw new Error("No fee payer found in transaction");

          console.log("returning", {
            id: wallet,
            wallet,
            auth: "wallet",
          });

          return {
            id: wallet,
            wallet,
            auth: "wallet",
          };
        } catch (e) {
          return null;
        }
      },
    }),
  ];

  const isDefaultSigninPage =
    req.method === "GET" && req.query.nextauth?.includes("signin");

  // Hides Sign-In with Solana from the default sign page
  if (isDefaultSigninPage) {
    providers.pop();
  }

  return await NextAuth(req, res, {
    providers,
    session: {
      strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
      jwt: async ({ token, user }) => {
        user && (token.user = user);
        return token;
      },
      async session({ session, token }) {
        const rawToken = await encode({ token, secret });

        const response = await fetch(`${baseUrl}/api/games/user`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${rawToken}`,
          },
          body: JSON.stringify({
            //@ts-ignore
            wallet: token?.user?.wallet,
            //@ts-ignore
            email: token?.user?.email,
            //@ts-ignore
            name: token?.user?.name,
            //@ts-ignore
            image: token?.user?.image,
            //@ts-ignore
            emailSub: token?.sub
          }),
        });

        const data = await response.json();
        if (data?.success && data?.user) {
          console.log("db", data?.user);
          session.user = data?.user;
          console.log("session", session.user)
          return session;
        } else {
          throw new Error("Failed to create or update user");
        }
      },
    },
  });
}

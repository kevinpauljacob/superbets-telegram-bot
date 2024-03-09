import { validateAuthTx } from "@/utils/signinMessage";
import { Transaction } from "@solana/web3.js";
import { NextApiRequest, NextApiResponse } from "next";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getCsrfToken } from "next-auth/react";

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  const providers = [
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

          return {
            id: signedTx.feePayer as any,
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
      async session({ session, token }) {
        // @ts-ignore
        session.publicKey = token.sub;

        if (session.user) {
          session.user.name = token.sub;
          session.user.image = `https://ui-avatars.com/api/?name=${token.sub}&background=random`;
        }
        return session;
      },
    },
  });
}

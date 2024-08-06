import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// import { Ratelimit } from "@upstash/ratelimit";
// import { Redis } from "@upstash/redis";
import { getToken } from "next-auth/jwt";

// const rateLimit = new Ratelimit({
//   redis: Redis.fromEnv(),
//   limiter: Ratelimit.fixedWindow(10, "1 s"),
//   analytics: true,
//   timeout: 10000,
// });

const API_KEY_HEADER = "x-api-key";
const secret = process.env.NEXTAUTH_SECRET;

const validateApiKey = async (apiKey: string): Promise<boolean> => {
  const validApiKeys = ["valid-api-key-1", "valid-api-key-2"];
  return validApiKeys.includes(apiKey);
};

const whiteListRoutes = [
  "/api/auth",
  "/api/games/global",
  "/api/games/user",
  "/api/getInfo",
];

const specificRoutes = [
  "/api/referral/web2User",
  "/api/referral/web2User/claim",
  // Add any other specific routes here
];

const isDynamicOrSpecificRoute = (pathname: string): boolean => {
  const segments = pathname.split("/");
  return (
    segments.some(
      (segment) => segment.startsWith("[") && segment.endsWith("]"),
    ) || specificRoutes.some((route) => pathname.startsWith(route))
  );
};

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? "127.0.0.1";

  // const { success, pending, limit, reset, remaining } =
  //   await rateLimit.limit(ip);
  const success = true;
  const limit = 0;
  const reset = 0;
  const remaining = 0;

  let res: NextResponse = new NextResponse("Unauthorized", { status: 401 });

  if (
    request.nextUrl.pathname === "/api/blocked" ||
    whiteListRoutes.some((route) => request.nextUrl.pathname.includes(route)) ||
    isDynamicOrSpecificRoute(request.nextUrl.pathname) ||
    request.method === "GET"
  ) {
    if (success) res = NextResponse.next();
    else res = NextResponse.rewrite(new URL("/api/blocked", request.url));
  } else {
    const apiKey = request.headers.get(API_KEY_HEADER);

    if (apiKey) {
      const isValidApiKey = await validateApiKey(apiKey);
      console.log(isValidApiKey, success);
      if (isValidApiKey) {
        if (success) res = NextResponse.next();
        else res = NextResponse.rewrite(new URL("/api/blocked", request.url));
      } else
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 },
        );
    } else {
      const token = await getToken({ req: request, secret });
      if (token && token.sub) {
        let body = await request.json();
        let query = request.nextUrl.searchParams;
        const wallet = body?.wallet || query.get("wallet");
        const email = body?.email || query.get("email");
        const account = body?.account || query.get("account");
        console.log("email", email);
        if (
          (!wallet && !email && !account) ||
          //@ts-ignore
          (wallet && token?.user?.wallet != wallet) ||
          //@ts-ignore
          (email && token?.user?.email !== email) ||
          //@ts-ignore
          (account && token?.user?.id !== account)
        )
          return NextResponse.json(
            { success: false, message: "Unauthorized" },
            { status: 401 },
          );
        else {
          if (success) res = NextResponse.next();
          else res = NextResponse.rewrite(new URL("/api/blocked", request.url));
        }
      } else
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 },
        );
    }
  }
  res.headers.set("X-RateLimit-Limit", limit.toString());
  res.headers.set("X-RateLimit-Remaining", remaining.toString());
  res.headers.set("X-RateLimit-Reset", reset.toString());
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );

  return res;
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: "/api/:path*",
};

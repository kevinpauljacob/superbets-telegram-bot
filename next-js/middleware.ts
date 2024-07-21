import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const rateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.fixedWindow(5, "1 s"),
  analytics: true,
  timeout: 10000,
});

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? "127.0.0.1";

  if (request.nextUrl.pathname === "/api/blocked") return NextResponse.next();

  const { success, pending, limit, reset, remaining } =
    await rateLimit.limit(ip);

  const res = success
    ? NextResponse.next()
    : NextResponse.rewrite(new URL("/api/blocked", request.url));

  res.headers.set("X-RateLimit-Limit", limit.toString());
  res.headers.set("X-RateLimit-Remaining", remaining.toString());
  res.headers.set("X-RateLimit-Reset", reset.toString());

  return res;
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: "/api/:path*",
};

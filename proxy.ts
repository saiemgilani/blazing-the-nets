import { NextResponse, type NextRequest } from "next/server";
import { internalPath, isInternalPath } from "./lib/routes.ts";

/**
 * Rewrites ?season= / ?team= URLs onto the prerendered internal routes (see lib/routes.ts), and
 * marks direct hits on those internal routes noindex (the public URLs carry the canonical tags).
 */
export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const target = internalPath(pathname, searchParams);
  if (target) {
    const url = request.nextUrl.clone();
    url.pathname = target;
    url.searchParams.delete("season");
    url.searchParams.delete("team");
    return NextResponse.rewrite(url);
  }
  const res = NextResponse.next();
  if (isInternalPath(pathname)) res.headers.set("X-Robots-Tag", "noindex");
  return res;
}

export const config = {
  matcher: ["/", "/home/:path*", "/players/:path*", "/teams/:path*"],
};

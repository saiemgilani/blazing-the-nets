import { NextResponse, type NextRequest } from "next/server";
import { internalPath, isInternalPath, isOgImagePath } from "./lib/routes.ts";

/**
 * Rewrites ?season= / ?team= URLs onto the prerendered internal routes (see lib/routes.ts). Direct
 * requests for an internal route 404, so each page has one public URL and crafted paths cannot
 * create cache entries; the OG image path, which metadata links to, is the one exception.
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
  if (isInternalPath(pathname) && !isOgImagePath(pathname)) {
    return new NextResponse("Not found", { status: 404, headers: { "content-type": "text/plain" } });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/home/:path*", "/players/:path*", "/teams/:path*", "/scatter/:path*", "/leaders/:path*"],
};

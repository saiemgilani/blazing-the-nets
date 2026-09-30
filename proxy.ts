import { NextResponse, type NextRequest } from "next/server";
import { internalPath } from "./lib/routes.ts";

/** Rewrites ?season= / ?team= URLs onto the prerendered internal routes (see lib/routes.ts). */
export function proxy(request: NextRequest) {
  const target = internalPath(request.nextUrl.pathname, request.nextUrl.searchParams);
  if (!target) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = target;
  url.searchParams.delete("season");
  url.searchParams.delete("team");
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/", "/players", "/players/:id", "/teams", "/teams/:id"],
};

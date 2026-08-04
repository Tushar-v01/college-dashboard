import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";
import { routeAccessMap } from "./lib/settings";

// Separate, edge-safe NextAuth instance (no Prisma/bcrypt providers) — middleware
// only needs to read the JWT, not run the Credentials authorize() callback.
const { auth } = NextAuth(authConfig);

const matchers = Object.keys(routeAccessMap).map((route) => ({
  matcher: new RegExp(`^${route}$`),
  allowedRoles: routeAccessMap[route],
}));

export default auth((req) => {
  const role = req.auth?.user?.role;
  const pathname = req.nextUrl.pathname;

  for (const { matcher, allowedRoles } of matchers) {
    if (matcher.test(pathname)) {
      if (!role) {
        return NextResponse.redirect(new URL("/", req.url));
      }
      if (!allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL(`/${role}`, req.url));
      }
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

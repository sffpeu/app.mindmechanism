import { clerkMiddleware, getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/", "/glossary", "/api/public(.*)", "/about"];
const ignoredPaths = ["/api/webhooks(.*)"];

function isPublic(path: string) {
  return publicPaths.find((x) =>
    path.match(new RegExp(`^${x}$`.replace("*$", "($|/)")))
  );
}

function isIgnored(path: string) {
  return ignoredPaths.find((x) =>
    path.match(new RegExp(`^${x}$`.replace("*$", "($|/)")))
  );
}

export default clerkMiddleware(async (req) => {
  const { userId } = getAuth(req);
  const path = req.nextUrl.pathname;
  
  if (isIgnored(path)) {
    return NextResponse.next();
  }
  
  if (isPublic(path)) {
    return NextResponse.next();
  }
  
  // If the user is not signed in and the path is not public, redirect them to the sign-in page
  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }
  
  return NextResponse.next();
});

// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
    "/api/(.*)",
  ],
}; 
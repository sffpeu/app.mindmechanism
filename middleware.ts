import { withClerkMiddleware, NextResponse } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

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

export default withClerkMiddleware((request: NextRequest) => {
  const path = request.nextUrl.pathname;
  
  if (isIgnored(path)) {
    return NextResponse.next();
  }
  
  if (isPublic(path)) {
    return NextResponse.next();
  }
  
  // If the user is not signed in and the path is not public, redirect them to the sign-in page
  const { userId } = request.auth;
  if (!userId) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirect_url', request.url);
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
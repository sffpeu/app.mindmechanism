import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  // Routes that can be accessed while signed out
  publicRoutes: [
    "/",
    "/glossary",
    "/api/public(.*)",
    "/about",
  ],
  // Routes that always bypass authentication
  ignoredRoutes: [
    "/api/webhooks(.*)",
  ]
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
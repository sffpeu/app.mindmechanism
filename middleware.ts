import { authMiddleware } from "@clerk/nextjs/server";

export default authMiddleware({
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
    "/((?!.+\\.[\\w]+$|_next).*)", // exclude all files in the public folder
    "/(api|trpc)(.*)", // include all API routes
  ],
}; 
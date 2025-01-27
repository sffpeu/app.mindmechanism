import { authMiddleware } from "@clerk/nextjs";

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
    // Skip Next.js internals and all static files
    "/((?!.*\\..*|_next).*)",
    // Optional: Protect API routes
    "/api/(.*)",
  ],
}; 
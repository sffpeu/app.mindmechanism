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

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}; 
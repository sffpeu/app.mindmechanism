import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === '/' || path === '/home' || path === '/home/' || path.startsWith('/auth/')

  // Get the Firebase auth token from the cookies
  const token = request.cookies.get('__firebase_auth_token')?.value

  // If we're on a protected path and there's no token, redirect to home (login screen)
  if (!isPublicPath && !token) {
    const url = new URL('/home', request.url)
    url.searchParams.set('callbackUrl', path)
    return NextResponse.redirect(url)
  }

  // If we're on the home page and have a token, redirect to dashboard
  if (path === '/' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If we're on home or auth pages and have a token, redirect to dashboard
  if ((path === '/home' || path === '/home/' || path.startsWith('/auth/')) && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

// Configure the paths that should be matched by the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
} 
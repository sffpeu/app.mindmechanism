import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === '/'

  // Get the Firebase auth token from the cookies
  const token = request.cookies.get('__firebase_auth_token')?.value

  // If we're on a protected path and there's no token, redirect to home
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // If we're on the home page and have a token, redirect to dashboard
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

// Configure the paths that should be matched by the middleware
export const config = {
  matcher: [
    '/',
    '/dashboard',
    '/sessions',
    '/notes',
    '/nodes',
    '/glossary',
    '/settings',
    '/clock/:path*'
  ]
} 
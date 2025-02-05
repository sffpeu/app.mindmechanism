import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === '/'

  // Get the token from the cookies
  const token = request.cookies.get('session')?.value

  // Redirect logic
  if (!isPublicPath && !token) {
    // Redirect to home page if trying to access protected route without auth
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (isPublicPath && token) {
    // Redirect to dashboard if trying to access public route while authenticated
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
    '/glossary',
    '/settings',
    '/clock/:path*'
  ]
} 
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
     * Match all request paths except:
     * - api, _next/static, _next/image, favicon.ico
     * - public folder path
     * - static assets (images, etc.) so they load without auth redirect
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|mp3|wav|ogg|csv)$).*)',
  ],
} 
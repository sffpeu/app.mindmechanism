import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { GATE_COOKIE, GATE_PATH, getGateToken, isGateExemptPath } from '@/lib/siteGate'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // ---------------------------------------------------------------------
  // Site gate. Nothing below this point is reachable without the passcode.
  // ---------------------------------------------------------------------
  const gateToken = getGateToken()
  const presented = request.cookies.get(GATE_COOKIE)?.value
  // With no token configured the site stays shut rather than falling open.
  const isThroughGate = Boolean(gateToken) && presented === gateToken
  const isGatePage = path === GATE_PATH || path === `${GATE_PATH}/`

  if (!isThroughGate && !isGateExemptPath(path)) {
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Not available.' }, { status: 404 })
    }
    const url = new URL(`${GATE_PATH}/`, request.url)
    if (path !== '/' && path !== '') url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  // Nobody who is already through needs to see the gate again.
  if (isThroughGate && isGatePage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // The gate page itself sits outside the Firebase sign-in rules below.
  if (isGatePage) {
    return NextResponse.next()
  }

  // API routes handle their own authorisation from here on.
  if (path.startsWith('/api/')) {
    return NextResponse.next()
  }

  // ---------------------------------------------------------------------
  // Firebase sign-in, unchanged.
  // ---------------------------------------------------------------------

  // Define public paths that don't require authentication
  const isPublicPath = path === '/' || path === '/home' || path === '/home/' || path.startsWith('/auth/') || path === '/ceremony-preview'

  // Get the Firebase auth token from the cookies
  const token = request.cookies.get('__firebase_auth_token')?.value

  // If we're on a protected path and there's no token, redirect to home (login screen)
  if (!isPublicPath && !token) {
    const url = new URL('/home', request.url)
    url.searchParams.set('callbackUrl', path)
    return NextResponse.redirect(url)
  }

  // If we're on the home page and have a token, go to post-login welcome splash
  if (path === '/' && token) {
    return NextResponse.redirect(new URL('/welcome', request.url))
  }

  // If we're on home or auth pages and have a token, redirect to welcome (then user continues to the app)
  const isVerifyEmailPath = path === '/auth/verify-email' || path === '/auth/verify-email/'
  if ((path === '/home' || path === '/home/' || path.startsWith('/auth/')) && token) {
    if (!isVerifyEmailPath) {
      return NextResponse.redirect(new URL('/welcome', request.url))
    }
  }

  return NextResponse.next()
}

// Configure the paths that should be matched by the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image, favicon.ico
     * - public folder path
     * - static assets (images, etc.) so they load without auth redirect
     *
     * API routes are matched too, so the gate covers them as well.
     */
    '/((?!_next/static|_next/image|favicon.ico|public|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|mp3|wav|ogg|csv)$).*)',
  ],
}

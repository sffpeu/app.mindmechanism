import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { GATE_COOKIE, GATE_COOKIE_MAX_AGE, getGatePasscode, getGateToken } from '@/lib/siteGate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Attempts allowed from one address before it is made to wait. */
const MAX_ATTEMPTS = 8
const WINDOW_MS = 10 * 60 * 1000

/**
 * Per-instance throttle. Serverless instances are short-lived, so this is a
 * brake on scripted guessing rather than a hard limit.
 */
const attempts = new Map<string, { count: number; first: number }>()

function clientAddress(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

function isThrottled(address: string): boolean {
  const now = Date.now()
  const record = attempts.get(address)
  if (!record || now - record.first > WINDOW_MS) {
    attempts.set(address, { count: 1, first: now })
    return false
  }
  record.count += 1
  return record.count > MAX_ATTEMPTS
}

function matches(supplied: string, expected: string): boolean {
  const a = Buffer.from(supplied)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function POST(request: Request) {
  const passcode = getGatePasscode()
  const token = getGateToken()

  if (!passcode || !token) {
    return NextResponse.json(
      { error: 'The gate is not configured. Set SITE_PASSCODE and SITE_GATE_TOKEN.' },
      { status: 503 }
    )
  }

  if (isThrottled(clientAddress(request))) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  }

  let supplied = ''
  try {
    const body = (await request.json()) as { code?: unknown }
    if (typeof body.code === 'string') supplied = body.code.trim()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // A uniform pause on every attempt, so timing reveals nothing.
  await new Promise((resolve) => setTimeout(resolve, 400))

  if (!supplied || !matches(supplied, passcode)) {
    return NextResponse.json({ error: 'Not recognised.' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(GATE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: GATE_COOKIE_MAX_AGE,
  })
  return response
}

/** Closing the gate again from this browser. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(GATE_COOKIE, '', { path: '/', maxAge: 0 })
  return response
}

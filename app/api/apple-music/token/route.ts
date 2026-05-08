/**
 * GET /api/apple-music/token
 *
 * Generates a MusicKit developer token (JWT) signed with the private key
 * from Apple Developer → Certificates → MusicKit.
 *
 * Required env vars (.env.local):
 *   APPLE_MUSIC_TEAM_ID    — 10-char Team ID from developer.apple.com/account
 *   APPLE_MUSIC_KEY_ID     — Key ID from the MusicKit key you created
 *   APPLE_MUSIC_PRIVATE_KEY — Contents of the .p8 file (with -----BEGIN/END lines)
 *
 * The token is valid for 6 months. In production cache it; for now we
 * regenerate on each call (cheap — pure crypto, no network).
 */

import { NextResponse } from 'next/server'
import { createSign } from 'node:crypto'

export const runtime = 'nodejs'

function base64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input
  return buf.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export async function GET() {
  const teamId = process.env.APPLE_MUSIC_TEAM_ID
  const keyId  = process.env.APPLE_MUSIC_KEY_ID
  const rawKey = process.env.APPLE_MUSIC_PRIVATE_KEY

  if (!teamId || !keyId || !rawKey) {
    return NextResponse.json(
      { error: 'Apple Music credentials not configured (APPLE_MUSIC_TEAM_ID, APPLE_MUSIC_KEY_ID, APPLE_MUSIC_PRIVATE_KEY)' },
      { status: 503 }
    )
  }

  // Restore PEM line breaks if the env var was stored as a single line
  const privateKey = rawKey.includes('\n')
    ? rawKey
    : rawKey
        .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
        .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----')

  const now = Math.floor(Date.now() / 1000)
  const exp = now + 60 * 60 * 24 * 180 // 180 days

  const header  = base64url(JSON.stringify({ alg: 'ES256', kid: keyId }))
  const payload = base64url(JSON.stringify({ iss: teamId, iat: now, exp }))
  const signing = `${header}.${payload}`

  const sign = createSign('SHA256')
  sign.update(signing)
  const sig = sign.sign({ key: privateKey, dsaEncoding: 'ieee-p1363' })
  const token = `${signing}.${base64url(sig)}`

  return NextResponse.json({ token })
}

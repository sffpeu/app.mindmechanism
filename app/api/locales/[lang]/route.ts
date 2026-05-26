import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { verifyFirebaseRequestUid } from '@/lib/verifyFirebaseRequestUid'
import { getFirestore } from 'firebase-admin/firestore'
import { getFirebaseAdminApp } from '@/lib/firebaseAdmin'
import type { LanguageAccessClaim } from '@/types/Passport'
import type { SupportedLocale } from '@/lib/i18n/types'

export const runtime = 'nodejs'

const SUPPORTED: SupportedLocale[] = ['en', 'de', 'fi', 'fr', 'es', 'it']
const NAMESPACES = ['common', 'portal', 'grammar-transit', 'info'] as const

async function getUserLanguageAccess(uid: string): Promise<SupportedLocale[]> {
  try {
    const db = getFirestore(getFirebaseAdminApp())
    const snap = await db.collection('passport').doc(uid).get()
    if (!snap.exists) return ['en']
    const claim = snap.data()?.languageAccess as LanguageAccessClaim | undefined
    if (!claim?.codes?.length) return ['en']
    return claim.codes.includes('en') ? claim.codes : ['en', ...claim.codes]
  } catch {
    return ['en']
  }
}

async function loadLocaleBundle(locale: SupportedLocale): Promise<Record<string, unknown>> {
  const localesDir = path.join(process.cwd(), 'public', 'locales', locale)
  const bundle: Record<string, unknown> = {}
  await Promise.all(
    NAMESPACES.map(async (ns) => {
      try {
        const raw = await readFile(path.join(localesDir, `${ns}.json`), 'utf-8')
        bundle[ns] = JSON.parse(raw)
      } catch {
        // namespace file missing — skip silently
      }
    }),
  )
  return bundle
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lang: string }> },
) {
  const { lang } = await params
  const locale = lang as SupportedLocale

  if (!SUPPORTED.includes(locale)) {
    return NextResponse.json({ error: `Unsupported locale: ${locale}` }, { status: 400 })
  }

  // English is always public — no auth required
  if (locale !== 'en') {
    const uid = await verifyFirebaseRequestUid(req)
    if (!uid) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }
    const access = await getUserLanguageAccess(uid)
    if (!access.includes(locale)) {
      return NextResponse.json(
        { error: `Language '${locale}' is not unlocked on your passport.` },
        { status: 403 },
      )
    }
  }

  const bundle = await loadLocaleBundle(locale)
  // Add a bundle version so clients can detect when namespaces change
  const BUNDLE_VERSION = 2 // increment when namespaces are added/removed
  return NextResponse.json({ ...bundle, _v: BUNDLE_VERSION }, {
    headers: {
      // no-store: never cache locale bundles — they are small, auth-gated,
      // and stale bundles cause missing-namespace failures (key paths shown
      // instead of translations).
      'Cache-Control': 'no-store',
    },
  })
}

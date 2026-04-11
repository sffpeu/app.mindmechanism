import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

/** Safe diagnostics for lobby setup (no secrets). */
function tryGetProjectIdFromServiceAccountEnv(): string | null {
  try {
    const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim()
    if (b64) {
      const j = JSON.parse(Buffer.from(b64, 'base64').toString('utf8')) as { project_id?: string }
      return typeof j.project_id === 'string' ? j.project_id : null
    }
    let raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()
    if (!raw) return null
    if (
      (raw.startsWith('"') && raw.endsWith('"')) ||
      (raw.startsWith("'") && raw.endsWith("'"))
    ) {
      raw = raw.slice(1, -1).replace(/\\"/g, '"')
    }
    const j = JSON.parse(raw) as { project_id?: string }
    return typeof j.project_id === 'string' ? j.project_id : null
  } catch {
    return null
  }
}

export async function GET() {
  const json = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim())
  const b64 = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim())
  const serviceAccountProjectId = tryGetProjectIdFromServiceAccountEnv()

  return NextResponse.json({
    serviceAccountJsonSet: json,
    serviceAccountBase64Set: b64,
    anyServiceAccountEnv: json || b64,
    /** If null, the env value is missing or not valid JSON — fix paste or use base64. */
    serviceAccountProjectId,
    clientProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? null,
    /** True when both IDs exist and differ (common cause of auth/API failures). */
    projectIdMismatch:
      Boolean(serviceAccountProjectId) &&
      Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) &&
      serviceAccountProjectId !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  })
}

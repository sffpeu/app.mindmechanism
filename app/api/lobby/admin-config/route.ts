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

function base64DecodesToJson(b64: string): boolean {
  try {
    const text = Buffer.from(b64.trim(), 'base64').toString('utf8')
    const o = JSON.parse(text) as { type?: string; project_id?: string }
    return o?.type === 'service_account' && typeof o?.project_id === 'string'
  } catch {
    return false
  }
}

export async function GET() {
  const jsonRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  const b64Raw = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64

  const json = Boolean(jsonRaw?.trim())
  const b64 = Boolean(b64Raw?.trim())
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

    /** Vercel: production | preview | development — env vars are per-environment. */
    vercelEnv: process.env.VERCEL_ENV ?? null,
    /** Key exists in process.env (even if empty string). */
    base64EnvKeyPresent: typeof b64Raw !== 'undefined',
    jsonEnvKeyPresent: typeof jsonRaw !== 'undefined',
    /** Length after trim — 0 means missing or whitespace-only. */
    base64TrimmedLength: b64Raw?.trim().length ?? 0,
    jsonTrimmedLength: jsonRaw?.trim().length ?? 0,
    /** False if base64 looks set but is not valid base64+service_account JSON. */
    base64LooksValid: b64 ? base64DecodesToJson(b64Raw ?? '') : false,

    checklist:
      !json && !b64
        ? [
            'Name must be exactly: FIREBASE_SERVICE_ACCOUNT_BASE64 (or FIREBASE_SERVICE_ACCOUNT_JSON).',
            'Enable the variable for Production (and Preview if you test preview URLs).',
            'Redeploy after saving — old deployments never see new env vars.',
            'Confirm this URL is the same Vercel project where you added the variable.',
          ]
        : b64 && !base64DecodesToJson(b64Raw ?? '')
          ? [
              'Value is not valid base64 of a Firebase service account JSON file.',
              'Run: base64 -i your-key.json | tr -d "\\n" | pbcopy — paste once, no quotes.',
            ]
          : [],
  })
}

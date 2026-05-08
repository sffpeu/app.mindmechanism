/** Planned lobby gatherings (calendar-friendly). Stored on `lobby_groups.scheduled_gatherings`. */

export const LOBBY_SCHEDULE_MAX_GATHERINGS = 24
/** Default number of future gatherings to show in the lobby schedule list. */
export const LOBBY_SCHEDULE_UPCOMING_DISPLAY_LIMIT = 10
/** Max ms in the future for a planned start (1 year). */
export const LOBBY_SCHEDULE_MAX_FUTURE_MS = 366 * 24 * 60 * 60 * 1000

export type LobbyScheduledGathering = {
  id: string
  starts_at_ms: number
  duration_minutes: number
  /** Short label shown in calendars (optional). */
  label?: string
}

export function newGatheringId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export function normalizeScheduledGatheringsFromClient(raw: unknown): LobbyScheduledGathering[] {
  if (!Array.isArray(raw)) return []
  const out: LobbyScheduledGathering[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const id = typeof o.id === 'string' && o.id.trim() ? o.id.trim() : newGatheringId()
    const starts =
      typeof o.starts_at_ms === 'number' && Number.isFinite(o.starts_at_ms) ? o.starts_at_ms : NaN
    const dur =
      typeof o.duration_minutes === 'number' && Number.isInteger(o.duration_minutes)
        ? o.duration_minutes
        : NaN
    const label = typeof o.label === 'string' ? o.label.trim().slice(0, 120) : undefined
    if (!Number.isFinite(starts) || !Number.isFinite(dur)) continue
    out.push({
      id,
      starts_at_ms: Math.round(starts),
      duration_minutes: dur,
      ...(label ? { label } : {}),
    })
  }
  return sortGatherings(out)
}

export function sortGatherings(g: LobbyScheduledGathering[]): LobbyScheduledGathering[] {
  return [...g].sort((a, b) => a.starts_at_ms - b.starts_at_ms || a.id.localeCompare(b.id))
}

/**
 * Future gatherings (start at or after `nowMs`), oldest first, capped for UI.
 * Use `totalUpcoming` to note when more exist beyond `items`.
 */
export function upcomingGatheringsWindow(
  gatherings: LobbyScheduledGathering[],
  options?: { limit?: number; nowMs?: number }
): {
  items: LobbyScheduledGathering[]
  totalUpcoming: number
  pastCount: number
} {
  const limit = options?.limit ?? LOBBY_SCHEDULE_UPCOMING_DISPLAY_LIMIT
  const nowMs = options?.nowMs ?? Date.now()
  const sorted = sortGatherings(gatherings)
  const upcomingAll = sorted.filter((g) => g.starts_at_ms >= nowMs)
  const pastCount = sorted.length - upcomingAll.length
  return {
    items: upcomingAll.slice(0, limit),
    totalUpcoming: upcomingAll.length,
    pastCount,
  }
}

export function validateScheduledGatherings(
  list: LobbyScheduledGathering[],
  nowMs: number = Date.now()
): string | null {
  if (list.length > LOBBY_SCHEDULE_MAX_GATHERINGS) {
    return `You can plan at most ${LOBBY_SCHEDULE_MAX_GATHERINGS} gatherings.`
  }
  const seen = new Set<string>()
  for (const g of list) {
    if (!g.id || seen.has(g.id)) return 'Duplicate or missing gathering id.'
    seen.add(g.id)
    if (!Number.isInteger(g.duration_minutes) || g.duration_minutes < 1 || g.duration_minutes > 180) {
      return 'Each gathering must use a duration between 1 and 180 minutes.'
    }
    if (g.starts_at_ms < nowMs - 120_000) {
      return 'Gathering start times cannot be more than 2 minutes in the past.'
    }
    if (g.starts_at_ms > nowMs + LOBBY_SCHEDULE_MAX_FUTURE_MS) {
      return 'Gathering is too far in the future (max about one year).'
    }
  }
  return null
}

export function parseScheduledGatheringsFromFirestore(data: Record<string, unknown>): LobbyScheduledGathering[] {
  const raw = data.scheduled_gatherings
  const normalized = normalizeScheduledGatheringsFromClient(raw)
  return sortGatherings(normalized)
}

export function scheduledGatheringsMatch(
  a: LobbyScheduledGathering[],
  b: LobbyScheduledGathering[]
): boolean {
  const sa = sortGatherings(a).map(serializeGathering)
  const sb = sortGatherings(b).map(serializeGathering)
  if (sa.length !== sb.length) return false
  return sa.every((s, i) => s === sb[i])
}

function serializeGathering(g: LobbyScheduledGathering): string {
  return `${g.id}|${g.starts_at_ms}|${g.duration_minutes}|${g.label ?? ''}`
}

/** Escape text for ICS (CRLF, fold lines per RFC — simplified: strip CR and escape special chars). */
function icsEscapeText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function formatIcsUtc(dt: Date): string {
  const y = dt.getUTCFullYear()
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const d = String(dt.getUTCDate()).padStart(2, '0')
  const h = String(dt.getUTCHours()).padStart(2, '0')
  const min = String(dt.getUTCMinutes()).padStart(2, '0')
  const sec = String(dt.getUTCSeconds()).padStart(2, '0')
  return `${y}${m}${d}T${h}${min}${sec}Z`
}

export function buildGatheringIcs(
  g: LobbyScheduledGathering,
  options: { title: string; description?: string; productId?: string }
): string {
  const start = new Date(g.starts_at_ms)
  const end = new Date(g.starts_at_ms + g.duration_minutes * 60 * 1000)
  const uid = `${g.id}@${options.productId ?? 'lobby.mindmechanism'}`
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mind Mechanism//Lobby Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatIcsUtc(new Date())}`,
    `DTSTART:${formatIcsUtc(start)}`,
    `DTEND:${formatIcsUtc(end)}`,
    `SUMMARY:${icsEscapeText(options.title)}`,
  ]
  if (options.description) {
    lines.push(`DESCRIPTION:${icsEscapeText(options.description)}`)
  }
  lines.push('END:VEVENT', 'END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadIcsFile(filename: string, contents: string): void {
  const blob = new Blob([contents], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Google Calendar “create event” URL (opens in browser; user confirms). */
export function googleCalendarUrlForGathering(
  g: LobbyScheduledGathering,
  options: { title: string; details?: string }
): string {
  const start = new Date(g.starts_at_ms)
  const end = new Date(g.starts_at_ms + g.duration_minutes * 60 * 1000)
  const fmt = (d: Date) => {
    const y = d.getUTCFullYear()
    const m = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')
    const h = String(d.getUTCHours()).padStart(2, '0')
    const min = String(d.getUTCMinutes()).padStart(2, '0')
    const sec = String(d.getUTCSeconds()).padStart(2, '0')
    return `${y}${m}${day}T${h}${min}${sec}Z`
  }
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: options.title,
    dates: `${fmt(start)}/${fmt(end)}`,
  })
  if (options.details) {
    params.set('details', options.details)
  }
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

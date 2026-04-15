import { clockSettings } from '@/lib/clockSettings'

/** Minutes — creator picks from UI; clamped 1–180 server-side. */
export const LOBBY_SESSION_DURATION_CHOICES = [5, 10, 15, 20, 30, 45, 60] as const

export type LobbySessionConfigInput = {
  mandalaClockId: number
  sessionDurationMinutes: number
  focusNodeIndices: number[]
}

export type LobbySessionPlan = {
  mandala_clock_id: number
  session_duration_minutes: number
  focus_node_indices: number[]
  creator_uid: string | null
}

export function normalizeFocusNodeIndices(indices: number[], focusNodeCount: number): number[] {
  const seen = new Set<number>()
  const out: number[] = []
  for (const n of indices) {
    if (!Number.isInteger(n) || n < 0 || n >= focusNodeCount) continue
    if (seen.has(n)) continue
    seen.add(n)
    out.push(n)
  }
  out.sort((a, b) => a - b)
  return out
}

function sortedNumberArraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  const as = [...a].sort((x, y) => x - y)
  const bs = [...b].sort((x, y) => x - y)
  return as.every((v, i) => v === bs[i])
}

export function validateLobbySessionConfig(input: LobbySessionConfigInput): string | null {
  const { mandalaClockId, sessionDurationMinutes, focusNodeIndices } = input
  if (!Number.isInteger(mandalaClockId) || mandalaClockId < 0 || mandalaClockId >= clockSettings.length) {
    return 'Invalid mandala.'
  }
  const maxNodes = clockSettings[mandalaClockId].focusNodes
  if (
    !Number.isFinite(sessionDurationMinutes) ||
    sessionDurationMinutes < 1 ||
    sessionDurationMinutes > 180
  ) {
    return 'Session duration must be between 1 and 180 minutes.'
  }
  if (!Number.isInteger(sessionDurationMinutes)) {
    return 'Session duration must be a whole number of minutes.'
  }
  for (const i of focusNodeIndices) {
    if (!Number.isInteger(i) || i < 0 || i >= maxNodes) {
      return 'Each focus node must match the selected mandala.'
    }
  }
  const norm = normalizeFocusNodeIndices(focusNodeIndices, maxNodes)
  if (norm.length === 0) {
    return 'Select at least one focus node.'
  }
  return null
}

/** Normalize indices after validation passes. */
export function finalizeLobbySessionIndices(input: LobbySessionConfigInput): number[] {
  const maxNodes = clockSettings[input.mandalaClockId].focusNodes
  return normalizeFocusNodeIndices(input.focusNodeIndices, maxNodes)
}

export function parseLobbySessionPlan(data: Record<string, unknown>): LobbySessionPlan | null {
  const mid = data.mandala_clock_id
  const dur = data.session_duration_minutes
  const raw = data.focus_node_indices
  const creator = data.creator_uid
  if (typeof mid !== 'number' || typeof dur !== 'number' || !Array.isArray(raw)) {
    return null
  }
  if (mid < 0 || mid >= clockSettings.length) return null
  const maxNodes = clockSettings[mid].focusNodes
  const indices = raw.filter((x): x is number => typeof x === 'number' && Number.isInteger(x))
  const norm = normalizeFocusNodeIndices(indices, maxNodes)
  if (norm.length === 0) return null
  return {
    mandala_clock_id: mid,
    session_duration_minutes: dur,
    focus_node_indices: norm,
    creator_uid: typeof creator === 'string' ? creator : null,
  }
}

export function storedSessionMatchesInput(
  data: Record<string, unknown>,
  input: LobbySessionConfigInput,
  finalizedIndices: number[]
): boolean {
  const mid = data.mandala_clock_id
  const dur = data.session_duration_minutes
  const raw = data.focus_node_indices
  if (typeof mid !== 'number' || typeof dur !== 'number' || !Array.isArray(raw)) {
    return false
  }
  if (mid !== input.mandalaClockId || dur !== input.sessionDurationMinutes) return false
  const indices = raw.filter((x): x is number => typeof x === 'number' && Number.isInteger(x))
  const stored = normalizeFocusNodeIndices(indices, clockSettings[mid].focusNodes)
  return sortedNumberArraysEqual(stored, finalizedIndices)
}

'use client'

import { useCallback, useEffect, useState } from 'react'
import { Building2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  approveAccessRequest,
  denyAccessRequest,
  listAccessHistory,
  listAccessGrants,
  listAccessRequests,
} from '@/lib/institutionalAccess'
import type { AccessGrantDoc, AccessLogEntry, AccessRequestDoc } from '@/types/InstitutionalAccess'
import { cn } from '@/lib/utils'

const SCOPE_LABELS: Record<string, string> = {
  phrase_progress: 'Phrase practice scores & sessions',
  node_affinity: 'Node affinity map',
  personal_lexicon_meta: 'Personal lexicon metadata (no decrypted text)',
  research_consent_summary: 'Research consent summary',
}

function fmtShort(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function InstitutionalAccessPanel({ uid }: { uid: string }) {
  const [requests, setRequests] = useState<Array<{ id: string; data: AccessRequestDoc }>>([])
  const [grants, setGrants] = useState<Array<{ id: string; data: AccessGrantDoc }>>([])
  const [history, setHistory] = useState<Array<{ id: string; data: AccessLogEntry }>>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [r, g, h] = await Promise.all([listAccessRequests(uid), listAccessGrants(uid), listAccessHistory(uid)])
      setRequests(r)
      setGrants(g)
      setHistory(h)
    } catch {
      toast.error('Could not load institutional access data.')
    } finally {
      setLoading(false)
    }
  }, [uid])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const pending = requests.filter((x) => x.data.status === 'pending')
  const decided = requests.filter((x) => x.data.status !== 'pending')
  const latestReadByRequest = new Map<string, string>()
  history.forEach(({ data }) => {
    if (data.action !== 'read') return
    const seen = latestReadByRequest.get(data.request_id)
    if (!seen || new Date(data.action_at).getTime() > new Date(seen).getTime()) {
      latestReadByRequest.set(data.request_id, data.action_at)
    }
  })

  const onApprove = async (requestId: string) => {
    setBusyId(requestId)
    try {
      const ok = await approveAccessRequest(uid, requestId)
      if (ok) {
        toast.success('Access approved. The institution can retrieve the grant token via the API.')
        await refresh()
      } else {
        toast.error('Could not approve this request.')
      }
    } finally {
      setBusyId(null)
    }
  }

  const onDeny = async (requestId: string) => {
    setBusyId(requestId)
    try {
      const ok = await denyAccessRequest(uid, requestId)
      if (ok) {
        toast.success('Request declined.')
        await refresh()
      } else {
        toast.error('Could not update this request.')
      }
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="rounded-2xl border border-black/8 bg-white/60 px-5 py-5 shadow-sm dark:border-white/8 dark:bg-neutral-950/60">
      <div className="flex items-center gap-2 text-gray-400 dark:text-neutral-500">
        <Building2 className="h-4 w-4" aria-hidden />
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em]">Institutional access</p>
      </div>
      <div className="my-3 border-t border-black/8 dark:border-white/8" />

      <p className="text-sm leading-relaxed text-gray-600 dark:text-neutral-300">
        When a partner institution requests read access to your Passport, it appears here. You approve or deny each
        request. Approved access is limited to the scopes and duration they asked for.
      </p>

      {loading ? (
        <div className="mt-4 h-20 animate-pulse rounded-lg bg-gray-100/90 dark:bg-white/5" />
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mt-4 space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-neutral-500">
                Pending requests
              </p>
              <ul className="space-y-3">
                {pending.map(({ id, data }) => (
                  <li
                    key={id}
                    className="rounded-xl border border-black/6 bg-white/50 px-3 py-3 dark:border-white/10 dark:bg-neutral-900/40"
                  >
                    <p className="font-medium text-gray-900 dark:text-white">{data.institution_name}</p>
                    <p className="mt-1 text-[11px] text-gray-500 dark:text-neutral-400">{data.institution_contact_email}</p>
                    <p className="mt-2 text-xs leading-relaxed text-gray-700 dark:text-neutral-300">{data.purpose}</p>
                    <ul className="mt-2 list-inside list-disc text-[11px] text-gray-600 dark:text-neutral-400">
                      {data.scopes.map((s) => (
                        <li key={s}>{SCOPE_LABELS[s] ?? s}</li>
                      ))}
                    </ul>
                    <p className="mt-1 text-[11px] text-gray-500">
                      Duration: {data.duration_days} day{data.duration_days === 1 ? '' : 's'} · Requested{' '}
                      {fmtShort(data.created_at)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busyId !== null}
                        onClick={() => void onApprove(id)}
                        className={cn(
                          'rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-50'
                        )}
                      >
                        {busyId === id ? 'Working…' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        disabled={busyId !== null}
                        onClick={() => void onDeny(id)}
                        className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-black/5 disabled:opacity-50 dark:border-white/15 dark:text-neutral-200 dark:hover:bg-white/5"
                      >
                        Deny
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {pending.length === 0 && (
            <p className="mt-4 text-xs text-gray-500 dark:text-neutral-400">No pending institutional requests.</p>
          )}

          {decided.length > 0 && (
            <div className="mt-6 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-neutral-500">
                Past requests
              </p>
              <ul className="space-y-2 text-[11px] text-gray-600 dark:text-neutral-400">
                {decided.slice(0, 8).map(({ id, data }) => (
                  <li key={id} className="flex flex-wrap justify-between gap-2 border-b border-black/5 pb-2 dark:border-white/10">
                    <span className="text-gray-800 dark:text-neutral-200">{data.institution_name}</span>
                    <span>
                      {data.status === 'approved' ? (
                        <span className="text-emerald-700 dark:text-emerald-400">Approved</span>
                      ) : (
                        <span className="text-gray-500">Declined</span>
                      )}{' '}
                      · {fmtShort(data.responded_at)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {grants.length > 0 && (
            <div className="mt-6 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-neutral-500">
                Active grants (approved)
              </p>
              <ul className="space-y-2 text-[11px] text-gray-600 dark:text-neutral-400">
                {grants.map(({ id, data }) => (
                  <li key={id} className="rounded-lg bg-black/[0.03] px-2 py-2 dark:bg-white/[0.04]">
                    <span className="font-mono text-[10px] text-gray-700 dark:text-neutral-300">
                      Grant …{data.grant_token.slice(-8)}
                    </span>
                    <span className="ml-2">
                      until {fmtShort(data.expires_at)} · {data.scopes.length} scope{data.scopes.length === 1 ? '' : 's'}
                    </span>
                    {latestReadByRequest.get(data.request_id) ? (
                      <span className="ml-2 text-gray-500">
                        · Last read: {fmtShort(latestReadByRequest.get(data.request_id))}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
              <p className="text-[10px] leading-relaxed text-gray-400 dark:text-neutral-500">
                Partners retrieve the full token using the institutional API after you approve — not shown here in full for
                clipboard safety.
              </p>
            </div>
          )}

          {history.length > 0 && (
            <div className="mt-6 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-neutral-500">
                History
              </p>
              <ul className="space-y-2 text-[11px] text-gray-600 dark:text-neutral-400">
                {history.slice(0, 10).map(({ id, data }) => (
                  <li key={id} className="flex flex-wrap justify-between gap-2 border-b border-black/5 pb-2 dark:border-white/10">
                    <span className="text-gray-800 dark:text-neutral-200">{data.requester_name}</span>
                    <span>
                      {data.action === 'approved' ? 'Approved' : data.action === 'denied' ? 'Denied' : data.action === 'read' ? 'Read' : 'Revoked'} · {fmtShort(data.action_at)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  )
}

'use client'

import { useCallback, useEffect, useState } from 'react'
import { BadgeCheck } from 'lucide-react'
import { toast } from 'sonner'
import {
  acceptCredential,
  getAcceptedCredentials,
  getPendingCredentialRequests,
  rejectCredential,
  setCredentialVisibility,
  type AcceptedCredential,
  type CredentialRequest,
} from '@/lib/credentialRequests'
import { getOrCreatePassportId } from '@/lib/passportIdentity'

function fmt(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function typeLabel(t: string): string {
  if (t === 'completion') return 'Course completion'
  if (t === 'assessment') return 'Assessment result'
  if (t === 'endorsement') return 'Endorsement'
  if (t === 'placement') return 'Placement record'
  return 'Note'
}

export function CredentialsPanel({ uid }: { uid: string }) {
  const [pending, setPending] = useState<CredentialRequest[]>([])
  const [accepted, setAccepted] = useState<AcceptedCredential[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const passportId = await getOrCreatePassportId(uid)
      const [pendingRows, acceptedRows] = await Promise.all([
        passportId ? getPendingCredentialRequests(passportId) : Promise.resolve([]),
        getAcceptedCredentials(uid),
      ])
      setPending(pendingRows)
      setAccepted(acceptedRows)
    } catch {
      toast.error('Could not load credential requests.')
    } finally {
      setLoading(false)
    }
  }, [uid])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const onAccept = async (row: CredentialRequest) => {
    const ok = window.confirm(
      `Accept credential?\n\n${row.issuer_name}\n${typeLabel(row.credential_type)} — ${row.credential_title}\n\n"${row.credential_description}"`
    )
    if (!ok) return
    setBusyId(row.id)
    try {
      await acceptCredential(uid, row.id)
      toast.success('Credential accepted and added to your Passport.')
      await refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not accept credential.')
    } finally {
      setBusyId(null)
    }
  }

  const onReject = async (row: CredentialRequest) => {
    setBusyId(row.id)
    try {
      await rejectCredential(uid, row.id)
      toast.success('Credential request rejected.')
      await refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not reject credential.')
    } finally {
      setBusyId(null)
    }
  }

  const onToggleVisibility = async (cred: AcceptedCredential) => {
    setBusyId(cred.id)
    try {
      await setCredentialVisibility(uid, cred.id, !cred.visible)
      await refresh()
    } catch {
      toast.error('Could not update visibility.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="rounded-2xl border border-black/8 bg-white/60 px-5 py-5 shadow-sm dark:border-white/8 dark:bg-neutral-950/60">
      <div className="flex items-center gap-2 text-gray-400 dark:text-neutral-500">
        <BadgeCheck className="h-4 w-4" aria-hidden />
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em]">Credentials</p>
      </div>
      <div className="my-3 border-t border-black/8 dark:border-white/8" />

      {loading ? (
        <div className="h-20 animate-pulse rounded-lg bg-gray-100/90 dark:bg-white/5" />
      ) : (
        <>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-neutral-500">
            Pending ({pending.length})
          </p>
          {pending.length === 0 ? (
            <p className="mt-2 text-xs text-gray-500 dark:text-neutral-400">
              No pending credential requests.
            </p>
          ) : (
            <ul className="mt-2 space-y-3">
              {pending.map((row) => (
                <li
                  key={row.id}
                  className="rounded-xl border border-black/6 bg-white/50 px-3 py-3 dark:border-white/10 dark:bg-neutral-900/40"
                >
                  <p className="font-medium text-gray-900 dark:text-white">{row.issuer_name}</p>
                  <p className="mt-1 text-sm text-gray-800 dark:text-neutral-200">
                    {typeLabel(row.credential_type)} — {row.credential_title}
                  </p>
                  <p className="mt-1 text-xs text-gray-600 dark:text-neutral-300">&quot;{row.credential_description}&quot;</p>
                  <p className="mt-1 text-[11px] text-gray-500">
                    Issued: {fmt(row.issued_at)}
                    {row.expires_at ? ` · Expires ${fmt(row.expires_at)}` : ''}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() => void onAccept(row)}
                      className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-50"
                    >
                      {busyId === row.id ? 'Working…' : 'Accept'}
                    </button>
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() => void onReject(row)}
                      className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-black/5 disabled:opacity-50 dark:border-white/15 dark:text-neutral-200 dark:hover:bg-white/5"
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="my-4 border-t border-black/8 dark:border-white/8" />

          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-neutral-500">
            Your credentials
          </p>
          {accepted.length === 0 ? (
            <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-neutral-400">
              No credentials yet. Share your Passport ID and access token with an institution to receive verified
              credentials.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {accepted.map((cred) => (
                <li
                  key={cred.id}
                  className={`rounded-lg px-3 py-2 ${cred.visible ? 'bg-black/[0.03] dark:bg-white/[0.04]' : 'bg-black/[0.015] opacity-60 dark:bg-white/[0.02]'}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {cred.credential_title} <span className="text-gray-500">· {cred.issuer_name}</span>
                    </p>
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() => void onToggleVisibility(cred)}
                      className="text-xs text-violet-600 underline underline-offset-2 hover:text-violet-500 disabled:opacity-50 dark:text-violet-400"
                    >
                      {cred.visible ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500">
                    Issued {fmt(cred.issued_at)}
                    {cred.expires_at ? ` · Expires ${fmt(cred.expires_at)}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}


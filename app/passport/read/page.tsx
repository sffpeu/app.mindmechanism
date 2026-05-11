'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const PASSPORT_ID_RE = /^MM-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/

type ReaderResponse = {
  passport_id: string
  requester_name?: string
  access_expires_at?: string | null
  scope?: string[]
  lexicon?: Array<{ word: string; language: string | null; clock_id: number | null; created_at: string | null }>
  phrases?: Array<Record<string, unknown>>
  affinity?: Record<string, unknown> | null
  consent_record?: {
    categoryB: { granted: boolean; timestamp: string; protocolVersion: string; txHash?: string | null } | null
    categoryC: { granted: boolean; timestamp: string; protocolVersion: string; txHash?: string | null } | null
  }
}

function fmtDate(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PassportReadPage() {
  const [passportId, setPassportId] = useState('')
  const [accessRequestId, setAccessRequestId] = useState('')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ReaderResponse | null>(null)

  const scope = useMemo(() => data?.scope ?? [], [data?.scope])

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setData(null)
    const pid = passportId.trim().toUpperCase()
    if (!PASSPORT_ID_RE.test(pid)) {
      setError('Passport ID must match MM-XXXX-XXXX-XXXX-XXXX.')
      return
    }
    if (!accessRequestId.trim() || !token.trim()) {
      setError('Access Request ID and Access Token are required.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/passport-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passport_id: pid,
          access_request_id: accessRequestId.trim(),
          token: token.trim(),
        }),
      })
      const payload = (await res.json().catch(() => ({}))) as ReaderResponse & { error?: string }
      if (!res.ok) {
        if (payload.error === 'Access token expired') {
          setError('This access token expired. Contact the Passport holder to request a renewal.')
        } else if (payload.error === 'Access is revoked') {
          setError('This access has been revoked by the Passport holder.')
        } else if (payload.error === 'Access is denied') {
          setError('Access was not granted for this request.')
        } else if (payload.error === 'Invalid token') {
          setError('The token does not match this access request.')
        } else {
          setError(payload.error ?? 'Unable to retrieve this Passport. Check your credentials and try again.')
        }
        return
      }
      setData(payload)
    } catch {
      setError('Unable to retrieve this Passport. Check your credentials and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">View a Learner&apos;s Passport</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-neutral-300">
        Enter the Passport ID and your access token to view the sections you have been approved for.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-black/10 p-5 dark:border-white/10">
        <div>
          <Label htmlFor="pid">Passport ID</Label>
          <Input id="pid" value={passportId} onChange={(e) => setPassportId(e.target.value)} placeholder="MM-XXXX-XXXX-XXXX-XXXX" />
        </div>
        <div>
          <Label htmlFor="arid">Access Request ID</Label>
          <Input id="arid" value={accessRequestId} onChange={(e) => setAccessRequestId(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="token">Access Token</Label>
          <Input id="token" value={token} onChange={(e) => setToken(e.target.value)} />
        </div>
        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        <Button type="submit" disabled={loading}>
          {loading ? 'Loading…' : 'View Passport'}
        </Button>
      </form>

      {data && (
        <section className="mt-8 rounded-2xl border border-black/10 p-5 dark:border-white/10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Learner&apos;s Passport</h2>
          <p className="mt-1 font-mono text-sm">{data.passport_id}</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-neutral-300">
            Access granted to: {data.requester_name ?? 'Institution'} · Expires: {fmtDate(data.access_expires_at)}
          </p>

          {scope.includes('personal_lexicon_meta') || scope.includes('lexicon') ? (
            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-400">
                Personal vocabulary ({data.lexicon?.length ?? 0} words)
              </h3>
              <ul className="mt-2 space-y-1 text-sm">
                {(data.lexicon ?? []).slice(0, 60).map((w, idx) => (
                  <li key={`${w.word}-${idx}`} className="text-gray-800 dark:text-neutral-200">
                    {w.word} {w.language ? `${w.language} ·` : ''} Node {w.clock_id ?? '-'} · Added {fmtDate(w.created_at)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {scope.includes('phrase_progress') || scope.includes('phrases') ? (
            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-400">
                Practice map
              </h3>
              <p className="mt-2 text-sm text-gray-800 dark:text-neutral-200">
                Phrases: {data.phrases?.length ?? 0}
              </p>
              {(data.phrases?.[0] as any)?.latestScore != null ? (
                <p className="text-sm text-gray-700 dark:text-neutral-300">
                  Latest score: {String((data.phrases?.[0] as any).latestScore)} · Best score:{' '}
                  {String((data.phrases?.[0] as any).bestScore ?? '-')}
                </p>
              ) : null}
            </div>
          ) : null}

          {scope.includes('node_affinity') || scope.includes('affinity') ? (
            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-400">
                Affinity profile
              </h3>
              <pre className="mt-2 overflow-auto rounded-md bg-black/[0.03] p-3 text-xs dark:bg-white/[0.04]">
                {JSON.stringify(data.affinity ?? null, null, 2)}
              </pre>
            </div>
          ) : null}

          {scope.includes('research_consent_summary') || scope.includes('consent_record') ? (
            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-400">
                Consent record
              </h3>
              <div className="mt-2 space-y-2 text-sm text-gray-800 dark:text-neutral-200">
                <p>
                  Category B: {data.consent_record?.categoryB?.granted ? 'Granted' : 'Not granted'} ·{' '}
                  {fmtDate(data.consent_record?.categoryB?.timestamp)}
                  {data.consent_record?.categoryB?.txHash ? (
                    <>
                      {' · '}
                      <Link
                        href={`https://polygonscan.com/tx/${data.consent_record.categoryB.txHash}`}
                        target="_blank"
                        className="text-violet-600 underline underline-offset-2 dark:text-violet-400"
                      >
                        Verify on Polygon ↗
                      </Link>
                    </>
                  ) : null}
                </p>
                <p>
                  Category C: {data.consent_record?.categoryC?.granted ? 'Granted' : 'Not granted'} ·{' '}
                  {fmtDate(data.consent_record?.categoryC?.timestamp)}
                  {data.consent_record?.categoryC?.txHash ? (
                    <>
                      {' · '}
                      <Link
                        href={`https://polygonscan.com/tx/${data.consent_record.categoryC.txHash}`}
                        target="_blank"
                        className="text-violet-600 underline underline-offset-2 dark:text-violet-400"
                      >
                        Verify on Polygon ↗
                      </Link>
                    </>
                  ) : null}
                </p>
              </div>
            </div>
          ) : null}
        </section>
      )}
    </main>
  )
}


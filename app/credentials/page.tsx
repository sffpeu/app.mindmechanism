'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { submitCredentialRequest, type CredentialType } from '@/lib/credentialRequests'

const PASSPORT_ID_RE = /^MM-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/

type FormState = {
  passport_id: string
  access_request_id: string
  token: string
  issuer_name: string
  issuer_email: string
  credential_type: CredentialType
  credential_title: string
  credential_description: string
  issued_at: string
  expires_at: string
  metadataText: string
}

const INITIAL_STATE: FormState = {
  passport_id: '',
  access_request_id: '',
  token: '',
  issuer_name: '',
  issuer_email: '',
  credential_type: 'completion',
  credential_title: '',
  credential_description: '',
  issued_at: '',
  expires_at: '',
  metadataText: '',
}

function parseMetadata(text: string): Record<string, string> {
  if (!text.trim()) return {}
  const parsed = JSON.parse(text) as unknown
  if (typeof parsed !== 'object' || parsed == null || Array.isArray(parsed)) {
    throw new Error('Metadata must be a JSON object')
  }
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof v !== 'string') throw new Error(`Metadata value for "${k}" must be a string`)
    out[k] = v
  }
  return out
}

export default function CredentialsPage() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((prev) => ({ ...prev, [k]: v }))
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!PASSPORT_ID_RE.test(form.passport_id.trim().toUpperCase())) {
      setError('Passport ID must match MM-XXXX-XXXX-XXXX-XXXX.')
      return
    }
    if (!form.access_request_id.trim()) {
      setError('Access Request ID is required.')
      return
    }
    if (!form.token.trim()) {
      setError('Access Token is required.')
      return
    }
    if (!form.credential_title.trim() || !form.credential_description.trim()) {
      setError('Credential title and description are required.')
      return
    }
    if (!form.issued_at) {
      setError('Date of issue is required.')
      return
    }

    let metadata: Record<string, string>
    try {
      metadata = parseMetadata(form.metadataText)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid metadata JSON')
      return
    }

    setSubmitting(true)
    try {
      await submitCredentialRequest({
        passport_id: form.passport_id.trim().toUpperCase(),
        access_request_id: form.access_request_id.trim(),
        token: form.token.trim(),
        issuer_name: form.issuer_name.trim(),
        issuer_email: form.issuer_email.trim(),
        credential_type: form.credential_type,
        credential_title: form.credential_title.trim(),
        credential_description: form.credential_description.trim(),
        issued_at: new Date(form.issued_at).toISOString(),
        ...(form.expires_at ? { expires_at: new Date(form.expires_at).toISOString() } : {}),
        metadata,
      })
      setSuccess('Your credential has been submitted. The Passport holder will review and accept or reject it.')
      setForm((prev) => ({ ...INITIAL_STATE, issuer_name: prev.issuer_name, issuer_email: prev.issuer_email }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit credential')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        Submit a credential to a Passport
      </h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-neutral-300">
        Use this form to write a verified credential into a Learner&apos;s Passport. You must have an approved access
        token for this Passport.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-5 rounded-2xl border border-black/10 p-5 dark:border-white/10">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="passport-id">Passport ID</Label>
            <Input
              id="passport-id"
              placeholder="MM-XXXX-XXXX-XXXX-XXXX"
              value={form.passport_id}
              onChange={(e) => set('passport_id', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="access-request-id">Access Request ID</Label>
            <Input
              id="access-request-id"
              value={form.access_request_id}
              onChange={(e) => set('access_request_id', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="access-token">Access Token</Label>
            <Input id="access-token" value={form.token} onChange={(e) => set('token', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="issuer-name">Issuer name</Label>
            <Input id="issuer-name" value={form.issuer_name} onChange={(e) => set('issuer_name', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="issuer-email">Issuer email</Label>
            <Input
              id="issuer-email"
              type="email"
              value={form.issuer_email}
              onChange={(e) => set('issuer_email', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Credential type</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {[
                ['completion', 'Course completion'],
                ['assessment', 'Assessment result'],
                ['endorsement', 'Endorsement'],
                ['placement', 'Placement record'],
                ['note', 'Note'],
              ].map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="credential_type"
                    checked={form.credential_type === value}
                    onChange={() => set('credential_type', value as CredentialType)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="credential-title">Credential title</Label>
            <Input
              id="credential-title"
              placeholder='e.g. "German A2 Course Completion"'
              value={form.credential_title}
              onChange={(e) => set('credential_title', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="credential-description">Description</Label>
            <textarea
              id="credential-description"
              className="mt-2 min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.credential_description}
              onChange={(e) => set('credential_description', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="issued-at">Date of issue</Label>
            <Input id="issued-at" type="date" value={form.issued_at} onChange={(e) => set('issued_at', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="expires-at">Expiry (optional)</Label>
            <Input
              id="expires-at"
              type="date"
              value={form.expires_at}
              onChange={(e) => set('expires_at', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="metadata">Metadata (optional JSON object)</Label>
            <textarea
              id="metadata"
              className="mt-2 min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
              value={form.metadataText}
              onChange={(e) => set('metadataText', e.target.value)}
              placeholder='{"course_hours":"120","grade":"A"}'
            />
          </div>
        </div>

        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{success}</p> : null}

        <Button type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit credential'}
        </Button>
      </form>
    </main>
  )
}


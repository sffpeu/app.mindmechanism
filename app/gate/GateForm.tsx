'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function GateFormInner() {
  const searchParams = useSearchParams()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (pending) return
    if (code.length === 0) return
    setPending(true)
    setError('')

    try {
      const response = await fetch('/api/gate/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      if (response.ok) {
        const next = searchParams.get('next')
        window.location.assign(next && next.startsWith('/') ? next : '/')
        return
      }

      const body = (await response.json().catch(() => ({}))) as { error?: string }
      setError(body.error ?? 'Not recognised.')
      setCode('')
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-white dark:bg-black px-6">
      <div className="w-full max-w-sm">
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          This site is not currently open.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex items-center gap-2">
          <label htmlFor="gate-code" className="sr-only">
            Passcode
          </label>
          <input
            id="gate-code"
            type="password"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            autoComplete="off"
            autoFocus
            spellCheck={false}
            className="flex-1 bg-transparent border-b border-gray-300 dark:border-white/20 px-1 py-2 text-gray-900 dark:text-gray-100 outline-none focus:border-gray-900 dark:focus:border-white/60 transition-colors"
          />
          <button
            type="submit"
            disabled={pending}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:hover:text-gray-500 transition-colors"
          >
            {pending ? '…' : 'Enter'}
          </button>
        </form>

        <p className="mt-3 h-5 text-xs text-red-600 dark:text-red-400" role="status" aria-live="polite">
          {error}
        </p>
      </div>
    </main>
  )
}

export function GateForm() {
  return (
    <Suspense fallback={null}>
      <GateFormInner />
    </Suspense>
  )
}

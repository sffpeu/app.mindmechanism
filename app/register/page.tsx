'use client'

import Link from 'next/link'

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Konto anlegen</h1>
      <p className="mb-8 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
        Fortfahren Sie zur Registrierung mit E-Mail oder Google — dasselbe Formular wie unter Start.
      </p>
      <Link
        href="/home?signup=1"
        className="block w-full bg-gray-900 px-6 py-3 text-center text-sm font-medium tracking-wide text-gray-100 transition-opacity hover:opacity-90 dark:bg-gray-100 dark:text-gray-900"
      >
        Weiter zur Registrierung
      </Link>
      <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
        Mit der Registrierung stimmen Sie unserer{' '}
        <Link href="/datenschutz" className="underline underline-offset-2">
          Datenschutzerklärung
        </Link>{' '}
        zu.
      </p>
    </main>
  )
}

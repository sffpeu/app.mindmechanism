'use client'

import { useLanguage } from '@/lib/i18n'

export function LegalContact({ clockHex }: { clockHex: string }) {
  const { t } = useLanguage()

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 text-sm leading-relaxed">

      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 leading-tight">
          {t('info', 'legal.title')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {t('info', 'legal.subtitle')}
        </p>
        <div
          className="mt-5 w-14 h-0.5 rounded-full"
          style={{ background: `linear-gradient(90deg, ${clockHex}, ${clockHex}66)` }}
        />
      </div>

      <Section title={t('info', 'legal.disclaimer.title')} clockHex={clockHex}>
        <P>{t('info', 'legal.disclaimer.p1')}</P>
      </Section>

      <HR />

      <Section title={t('info', 'legal.privacy.title')} clockHex={clockHex}>
        <P>{t('info', 'legal.privacy.p1')}</P>
      </Section>

      <HR />

      <Section title={t('info', 'legal.terms.title')} clockHex={clockHex}>
        <P>{t('info', 'legal.terms.p1')}</P>
      </Section>

      <HR />

      <Section title={t('info', 'legal.ip.title')} clockHex={clockHex}>
        <P>{t('info', 'legal.ip.p1')}</P>
      </Section>

      <HR />

      <Section title={t('info', 'legal.liability.title')} clockHex={clockHex}>
        <P>{t('info', 'legal.liability.p1')}</P>
      </Section>

      <HR />

      <Section title={t('info', 'legal.contact.title')} clockHex={clockHex}>
        <div className="space-y-2 text-gray-600 dark:text-gray-400">
          <p><a href="mailto:info@mindmechanism.com" className="underline" style={{ color: clockHex }}>info@mindmechanism.com</a></p>
          <p><a href="mailto:contact@mindmechanism.com" className="underline" style={{ color: clockHex }}>contact@mindmechanism.com</a></p>
          <p><a href="https://sffp.eu" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: clockHex }}>sffp.eu</a></p>
          <p className="mt-4 text-gray-500 dark:text-gray-500">{t('info', 'legal.contact.studio')}</p>
          <p className="text-gray-500 dark:text-gray-500">{t('info', 'legal.contact.developed')}</p>
        </div>
      </Section>

      <div className="mt-14 pt-5 border-t border-gray-200 dark:border-gray-800 text-center">
        <p className="text-[10px] tracking-widest uppercase text-gray-400 dark:text-gray-600">
          {t('info', 'footer')}
        </p>
      </div>

    </div>
  )
}

function Section({ title, clockHex, children }: { title: string; clockHex: string; children: React.ReactNode }) {
  return (
    <section className="mb-2">
      <h2 className="text-base font-semibold mb-4 tracking-tight" style={{ color: clockHex }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
      {children}
    </p>
  )
}

function HR() {
  return <hr className="my-8 border-gray-200 dark:border-gray-800" />
}

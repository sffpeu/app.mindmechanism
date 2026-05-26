'use client'

import { useLanguage } from '@/lib/i18n'

export function GettingStarted({ clockHex }: { clockHex: string }) {
  const { t } = useLanguage()

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 text-sm leading-relaxed">

      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 leading-tight">
          {t('info', 'guide.title')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {t('info', 'guide.subtitle')}
        </p>
        <div
          className="mt-5 w-14 h-0.5 rounded-full"
          style={{ background: `linear-gradient(90deg, ${clockHex}, ${clockHex}66)` }}
        />
      </div>

      <Section title={t('info', 'guide.signin.title')} clockHex={clockHex}>
        <P>{t('info', 'guide.signin.p1')}</P>
      </Section>

      <HR />

      <Section title={t('info', 'guide.home.title')} clockHex={clockHex}>
        <P>{t('info', 'guide.home.p1')}</P>
      </Section>

      <HR />

      <Section title={t('info', 'guide.wheels.title')} clockHex={clockHex}>
        <P>{t('info', 'guide.wheels.p1')}</P>
      </Section>

      <HR />

      <Section title={t('info', 'guide.glossary.title')} clockHex={clockHex}>
        <P>{t('info', 'guide.glossary.p1')}</P>
      </Section>

      <HR />

      <Section title={t('info', 'guide.journal.title')} clockHex={clockHex}>
        <P>{t('info', 'guide.journal.p1')}</P>
      </Section>

      <HR />

      <Section title={t('info', 'guide.dashboard.title')} clockHex={clockHex}>
        <P>{t('info', 'guide.dashboard.p1')}</P>
      </Section>

      <HR />

      <Section title={t('info', 'guide.settings.title')} clockHex={clockHex}>
        <P>{t('info', 'guide.settings.p1')}</P>
        <P>{t('info', 'guide.settings.p2')}</P>
      </Section>

      <HR />

      <Section title={t('info', 'guide.lobby.title')} clockHex={clockHex}>
        <P>{t('info', 'guide.lobby.p1')}</P>
      </Section>

      <HR />

      <Section title={t('info', 'guide.shadowpairs.title')} clockHex={clockHex}>
        <P>{t('info', 'guide.shadowpairs.p1')}</P>
      </Section>

      <HR />

      <Section title={t('info', 'guide.begin.title')} clockHex={clockHex}>
        <P>{t('info', 'guide.begin.p1')}</P>
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

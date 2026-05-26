'use client'

import { useLanguage } from '@/lib/i18n'

export function FAQ({ clockHex }: { clockHex: string }) {
  const { t } = useLanguage()

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 text-sm leading-relaxed">

      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 leading-tight">
          {t('info', 'faq.title')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {t('info', 'faq.subtitle')}
        </p>
        <div
          className="mt-5 w-14 h-0.5 rounded-full"
          style={{ background: `linear-gradient(90deg, ${clockHex}, ${clockHex}66)` }}
        />
      </div>

      <Section title={t('info', 'faq.essentials.title')} clockHex={clockHex}>
        <QA q={t('info', 'faq.essentials.q1.q')} a={t('info', 'faq.essentials.q1.a')} />
        <QA q={t('info', 'faq.essentials.q2.q')} a={t('info', 'faq.essentials.q2.a')} />
        <QA q={t('info', 'faq.essentials.q3.q')} a={t('info', 'faq.essentials.q3.a')} />
        <QA q={t('info', 'faq.essentials.q4.q')} a={t('info', 'faq.essentials.q4.a')} />
      </Section>

      <HR clockHex={clockHex} />

      <Section title={t('info', 'faq.system.title')} clockHex={clockHex}>
        <QA q={t('info', 'faq.system.q1.q')} a={t('info', 'faq.system.q1.a')} />
        <QA q={t('info', 'faq.system.q2.q')} a={t('info', 'faq.system.q2.a')} />
        <QA q={t('info', 'faq.system.q3.q')} a={t('info', 'faq.system.q3.a')} />
        <QA q={t('info', 'faq.system.q4.q')} a={t('info', 'faq.system.q4.a')} />
      </Section>

      <HR clockHex={clockHex} />

      <Section title={t('info', 'faq.using.title')} clockHex={clockHex}>
        <QA q={t('info', 'faq.using.q1.q')} a={t('info', 'faq.using.q1.a')} />
        <QA q={t('info', 'faq.using.q2.q')} a={t('info', 'faq.using.q2.a')} />
        <QA q={t('info', 'faq.using.q3.q')} a={t('info', 'faq.using.q3.a')} />
        <QA q={t('info', 'faq.using.q4.q')} a={t('info', 'faq.using.q4.a')} />
        <QA q={t('info', 'faq.using.q5.q')} a={t('info', 'faq.using.q5.a')} />
      </Section>

      <HR clockHex={clockHex} />

      <Section title={t('info', 'faq.deck.title')} clockHex={clockHex}>
        <QA q={t('info', 'faq.deck.q1.q')} a={t('info', 'faq.deck.q1.a')} />
        <QA q={t('info', 'faq.deck.q2.q')} a={t('info', 'faq.deck.q2.a')} />
        <QA q={t('info', 'faq.deck.q3.q')} a={t('info', 'faq.deck.q3.a')} />
      </Section>

      <HR clockHex={clockHex} />

      <Section title={t('info', 'faq.outcomes.title')} clockHex={clockHex}>
        <QA q={t('info', 'faq.outcomes.q1.q')} a={t('info', 'faq.outcomes.q1.a')} />
        <QA q={t('info', 'faq.outcomes.q2.q')} a={t('info', 'faq.outcomes.q2.a')} />
        <QA q={t('info', 'faq.outcomes.q3.q')} a={t('info', 'faq.outcomes.q3.a')} />
        <QA q={t('info', 'faq.outcomes.q4.q')} a={t('info', 'faq.outcomes.q4.a')} />
        <QA q={t('info', 'faq.outcomes.q5.q')} a={t('info', 'faq.outcomes.q5.a')} />
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
      <h2 className="text-base font-semibold mb-6 tracking-tight" style={{ color: clockHex }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function QA({ q, a }: { q: string; a: string }) {
  return (
    <div className="mb-6">
      <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1.5 leading-snug">{q}</p>
      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{a}</p>
    </div>
  )
}

function HR({ clockHex }: { clockHex: string }) {
  return (
    <hr className="my-8 border-gray-200 dark:border-gray-800" />
  )
}

'use client'

import { useLanguage } from '@/lib/i18n'

export function PrivacyData({ clockHex }: { clockHex: string }) {
  const { t } = useLanguage()

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 text-sm leading-relaxed">

      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 leading-tight">
          {t('info', 'privacy.title')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {t('info', 'privacy.subtitle')}
        </p>
        <div
          className="mt-5 w-14 h-0.5 rounded-full"
          style={{ background: `linear-gradient(90deg, ${clockHex}, ${clockHex}66)` }}
        />
      </div>

      <Section title={t('info', 'privacy.controller.title')} clockHex={clockHex}>
        <P>
          {t('info', 'privacy.controller.p1')}{' '}
          <a href="mailto:contact@sffp.eu" className="underline" style={{ color: clockHex }}>contact@sffp.eu</a>
        </P>
      </Section>

      <HR />

      <Section title={t('info', 'privacy.collect.title')} clockHex={clockHex}>
        <P>{t('info', 'privacy.collect.p1')}</P>
        <P>{t('info', 'privacy.collect.p2')}</P>
        <P>{t('info', 'privacy.collect.p3')}</P>
        <P>
          {t('info', 'privacy.collect.p4')}{' '}
          <a
            href="https://github.com/sffpeu/app.mindmechanism/blob/main/DATA_COLLECTION_PROTOCOL.md"
            className="underline"
            style={{ color: clockHex }}
          >
            {t('info', 'privacy.collect.p4link')}
          </a>.
        </P>
      </Section>

      <HR />

      <Section title={t('info', 'privacy.device.title')} clockHex={clockHex}>
        <P>{t('info', 'privacy.device.p1')}</P>
      </Section>

      <HR />

      <Section title={t('info', 'privacy.thirdparty.title')} clockHex={clockHex}>
        <P>{t('info', 'privacy.thirdparty.p1')}</P>
      </Section>

      <HR />

      <Section title={t('info', 'privacy.children.title')} clockHex={clockHex}>
        <P>{t('info', 'privacy.children.p1')}</P>
      </Section>

      <HR />

      <Section title={t('info', 'privacy.gdpr.title')} clockHex={clockHex}>
        <P>{t('info', 'privacy.gdpr.p1')}</P>
        <P>
          {t('info', 'privacy.gdpr.p2before')}{' '}
          <a href="mailto:future@theoneleggedpoet.com" className="underline" style={{ color: clockHex }}>
            future@theoneleggedpoet.com
          </a>
          {t('info', 'privacy.gdpr.p2after')}
        </P>
      </Section>

      <HR />

      <Section title={t('info', 'privacy.changes.title')} clockHex={clockHex}>
        <P>{t('info', 'privacy.changes.p1')}</P>
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

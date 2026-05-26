'use client'

import { useLanguage } from '@/lib/i18n'
import { RichText } from './RichText'

// ─── Immutable frequency / MIDI data (never translated) ─────────────────────
const WHEEL_CONSTANTS = [
  { freq: '136.10 Hz (C#3)', midi: '49' },
  { freq: '210.42 Hz (G#3)', midi: '56' },
  { freq: '126.22 Hz (B2)',  midi: '47' },
  { freq: '136.10 Hz (C#3)', midi: '49' },
  { freq: '141.27 Hz (C#3)', midi: '49' },
  { freq: '221.23 Hz (A3)',  midi: '57' },
  { freq: '172.06 Hz (F3)',  midi: '53' },
  { freq: '194.18 Hz (G3)',  midi: '55' },
  { freq: '136.10 Hz (C#3)', midi: '49' },
]

export function AboutMechanism({ clockHex }: { clockHex: string }) {
  const { t } = useLanguage()

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 text-sm leading-relaxed">

      {/* Title block */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 leading-tight">
          {t('info', 'mechanism.title')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {t('info', 'mechanism.subtitle')}
        </p>
        <div
          className="mt-5 w-14 h-0.5 rounded-full"
          style={{ background: `linear-gradient(90deg, ${clockHex}, ${clockHex}66)` }}
        />
      </div>

      {/* ── I. What It Is ── */}
      <Section title={t('info', 'mechanism.i.title')} clockHex={clockHex}>
        <P>{t('info', 'mechanism.i.p1')}</P>
        <P>{t('info', 'mechanism.i.p2')}</P>
        <P>{t('info', 'mechanism.i.p3')}</P>
      </Section>

      <HR />

      {/* ── II. The Architect ── */}
      <Section title={t('info', 'mechanism.ii.title')} clockHex={clockHex}>
        <P>{t('info', 'mechanism.ii.p1')}</P>
        <P>{t('info', 'mechanism.ii.p2')}</P>
        <P>{t('info', 'mechanism.ii.p3')}</P>
        <P>{t('info', 'mechanism.ii.p4')}</P>
      </Section>

      <HR />

      {/* ── III. Theoretical Lineage ── */}
      <Section title={t('info', 'mechanism.iii.title')} clockHex={clockHex}>
        <P>{t('info', 'mechanism.iii.p1')}</P>
        {/* Each theorist paragraph starts with **Name** bold marker */}
        <P><RichText text={t('info', 'mechanism.iii.jung')} /></P>
        <P><RichText text={t('info', 'mechanism.iii.kellogg')} /></P>
        <P><RichText text={t('info', 'mechanism.iii.krashen')} /></P>
        <P><RichText text={t('info', 'mechanism.iii.vygotsky')} /></P>
        <P><RichText text={t('info', 'mechanism.iii.cummins')} /></P>
        <P><RichText text={t('info', 'mechanism.iii.swain')} /></P>
        <P><RichText text={t('info', 'mechanism.iii.horwitz')} /></P>
      </Section>

      <HR />

      {/* ── IV. The Architecture ── */}
      <Section title={t('info', 'mechanism.iv.title')} clockHex={clockHex}>

        <H3>{t('info', 'mechanism.iv.s1.title')}</H3>
        <P>{t('info', 'mechanism.iv.s1.p1')}</P>

        {/* Frequency table — wheel names and domains come from i18n; Hz/MIDI are constants */}
        <div className="overflow-x-auto my-4">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                {[
                  t('info', 'mechanism.iv.s1.table.wheel'),
                  t('info', 'mechanism.iv.s1.table.domain'),
                  t('info', 'mechanism.iv.s1.table.freq'),
                  t('info', 'mechanism.iv.s1.table.midi'),
                ].map(h => (
                  <th
                    key={h}
                    className="text-left px-3 py-2 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-500 font-semibold uppercase tracking-wider text-[10px]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WHEEL_CONSTANTS.map((wc, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-900">
                  <td className="px-3 py-2 font-semibold text-gray-800 dark:text-gray-200">
                    {t('info', `mechanism.iv.s1.table.rows.${i + 1}.wheel`)}
                  </td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                    {t('info', `mechanism.iv.s1.table.rows.${i + 1}.domain`)}
                  </td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400 font-mono text-[11px]">{wc.freq}</td>
                  <td className="px-3 py-2 text-gray-500 dark:text-gray-500">{wc.midi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <P>{t('info', 'mechanism.iv.s1.p2')}</P>
        <P><RichText text={t('info', 'mechanism.iv.s1.p3')} /></P>

        <H3>{t('info', 'mechanism.iv.s2.title')}</H3>
        <P><RichText text={t('info', 'mechanism.iv.s2.p1')} /></P>
        <P>{t('info', 'mechanism.iv.s2.p2')}</P>
        <P>{t('info', 'mechanism.iv.s2.p3')}</P>
        <P><RichText text={t('info', 'mechanism.iv.s2.p4')} /></P>
        <P><RichText text={t('info', 'mechanism.iv.s2.p5')} /></P>
        <P>{t('info', 'mechanism.iv.s2.p6')}</P>

        <H3>{t('info', 'mechanism.iv.s3.title')}</H3>
        <P><RichText text={t('info', 'mechanism.iv.s3.p1')} /></P>
        <P>{t('info', 'mechanism.iv.s3.p2')}</P>
        <P>{t('info', 'mechanism.iv.s3.p3')}</P>
        <P><RichText text={t('info', 'mechanism.iv.s3.p4')} /></P>

        <H3>{t('info', 'mechanism.iv.s4.title')}</H3>
        <P>{t('info', 'mechanism.iv.s4.p1')}</P>
        <P>{t('info', 'mechanism.iv.s4.p2')}</P>
        <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400 my-3">
          {(['1','2','3','4'] as const).map(n => (
            <li key={n}><RichText text={t('info', `mechanism.iv.s4.list.${n}`)} /></li>
          ))}
        </ul>

        <H3>{t('info', 'mechanism.iv.s5.title')}</H3>
        <P>{t('info', 'mechanism.iv.s5.p1')}</P>
        <P>{t('info', 'mechanism.iv.s5.p2')}</P>
        <P><RichText text={t('info', 'mechanism.iv.s5.consumer_label')} /></P>
        <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400 my-2">
          {(['1','2','3'] as const).map(n => (
            <li key={n}>{t('info', `mechanism.iv.s5.consumer_list.${n}`)}</li>
          ))}
        </ul>
        <P><RichText text={t('info', 'mechanism.iv.s5.pro_label')} /></P>
        <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400 my-2">
          {(['1','2','3'] as const).map(n => (
            <li key={n}>{t('info', `mechanism.iv.s5.pro_list.${n}`)}</li>
          ))}
        </ul>
        <P><RichText text={t('info', 'mechanism.iv.s5.p3')} /></P>
        <P>{t('info', 'mechanism.iv.s5.p4')}</P>

        <H3>{t('info', 'mechanism.iv.s6.title')}</H3>
        <P>{t('info', 'mechanism.iv.s6.p1')}</P>
        <blockquote
          className="my-4 pl-4 pr-3 py-3 rounded-r-lg text-sm italic text-gray-500 dark:text-gray-400"
          style={{ borderLeft: `3px solid ${clockHex}`, background: `${clockHex}0a` }}
        >
          {t('info', 'mechanism.iv.s6.blockquote')}
        </blockquote>
        <P><RichText text={t('info', 'mechanism.iv.s6.p2')} /></P>
        <P>{t('info', 'mechanism.iv.s6.p3')}</P>

        <H3>{t('info', 'mechanism.iv.s7.title')}</H3>
        <P>{t('info', 'mechanism.iv.s7.p1')}</P>
        <ol className="list-decimal pl-5 space-y-2 text-gray-600 dark:text-gray-400 my-3">
          {(['1','2','3','4','5'] as const).map(n => (
            <li key={n}><RichText text={t('info', `mechanism.iv.s7.steps.${n}`)} /></li>
          ))}
        </ol>
        <P><RichText text={t('info', 'mechanism.iv.s7.p2')} /></P>

        <H3>{t('info', 'mechanism.iv.s8.title')}</H3>
        <P><RichText text={t('info', 'mechanism.iv.s8.blockade')} /></P>
        <P><RichText text={t('info', 'mechanism.iv.s8.falsekeys')} /></P>
        <P><RichText text={t('info', 'mechanism.iv.s8.foreman')} /></P>
        <P><RichText text={t('info', 'mechanism.iv.s8.acoustemic')} /></P>

      </Section>

      <HR />

      {/* ── V. Linguistic Sovereignty ── */}
      <Section title={t('info', 'mechanism.v.title')} clockHex={clockHex}>
        <P>{t('info', 'mechanism.v.p1')}</P>
        <P><RichText text={t('info', 'mechanism.v.p2')} /></P>
        <P><RichText text={t('info', 'mechanism.v.p3')} /></P>
        <P>{t('info', 'mechanism.v.p4')}</P>
        <ol className="list-decimal pl-5 space-y-3 text-gray-600 dark:text-gray-400 my-3">
          {(['1','2','3','4'] as const).map(n => (
            <li key={n}><RichText text={t('info', `mechanism.v.stages.${n}`)} /></li>
          ))}
        </ol>
        <P>{t('info', 'mechanism.v.p5')}</P>
      </Section>

      <HR />

      {/* ── VI. Clinical and Pedagogical Applications ── */}
      <Section title={t('info', 'mechanism.vi.title')} clockHex={clockHex}>
        <P>{t('info', 'mechanism.vi.p1')}</P>
        <P><RichText text={t('info', 'mechanism.vi.self')} /></P>
        <P><RichText text={t('info', 'mechanism.vi.therapy')} /></P>
        <P><RichText text={t('info', 'mechanism.vi.esl')} /></P>
        <P><RichText text={t('info', 'mechanism.vi.corporate')} /></P>
      </Section>

      <HR />

      {/* ── VII. The Philosophical Ground ── */}
      <Section title={t('info', 'mechanism.vii.title')} clockHex={clockHex}>
        <P>{t('info', 'mechanism.vii.p1')}</P>
        <P><RichText text={t('info', 'mechanism.vii.c1')} /></P>
        <P><RichText text={t('info', 'mechanism.vii.c2')} /></P>
        <P><RichText text={t('info', 'mechanism.vii.c3')} /></P>
        <P><RichText text={t('info', 'mechanism.vii.c4')} /></P>
      </Section>

      <HR />

      {/* ── VIII. Deployment ── */}
      <Section title={t('info', 'mechanism.viii.title')} clockHex={clockHex}>
        <P>{t('info', 'mechanism.viii.p1')}</P>
        <P>{t('info', 'mechanism.viii.p2')}</P>
      </Section>

      {/* Footer */}
      <div className="mt-14 pt-5 border-t border-gray-200 dark:border-gray-800 text-center">
        <p className="text-[10px] tracking-widest uppercase text-gray-400 dark:text-gray-600">
          {t('info', 'footer')}
        </p>
      </div>

    </div>
  )
}

/* ── Small layout helpers ── */

function Section({ title, clockHex, children }: { title: string; clockHex: string; children: React.ReactNode }) {
  return (
    <section className="mb-2">
      <h2
        className="text-base font-semibold mb-4 tracking-tight"
        style={{ color: clockHex }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-7 mb-3">
      {children}
    </h3>
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

'use client'

import { useLanguage } from '@/lib/i18n'
import { RichText } from './RichText'

export function AboutESL({ clockHex }: { clockHex: string }) {
  const { t } = useLanguage()

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 text-sm leading-relaxed">

      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 leading-tight">
          {t('info', 'esl.title')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {t('info', 'esl.subtitle')}
        </p>
        <div
          className="mt-5 w-14 h-0.5 rounded-full"
          style={{ background: `linear-gradient(90deg, ${clockHex}, ${clockHex}66)` }}
        />
      </div>

      <P>{t('info', 'esl.p1')}</P>
      <P>{t('info', 'esl.p2')}</P>
      <P>{t('info', 'esl.p3')}</P>
      <P>{t('info', 'esl.p4')}</P>

      {/* p5 is bold-marked: "**You are not being simplified...** */}
      <p className="text-gray-600 dark:text-gray-400 mb-3 leading-relaxed font-semibold text-gray-800 dark:text-gray-200">
        <RichText text={t('info', 'esl.p5')} />
      </p>

      <div className="mt-14 pt-5 border-t border-gray-200 dark:border-gray-800 text-center">
        <p className="text-[10px] tracking-widest uppercase text-gray-400 dark:text-gray-600">
          {t('info', 'footer')}
        </p>
      </div>

    </div>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-gray-600 dark:text-gray-400 mb-5 leading-relaxed">
      {children}
    </p>
  )
}

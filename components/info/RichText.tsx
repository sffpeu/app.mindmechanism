'use client'

import React from 'react'

/**
 * Renders a translation string that may contain inline bold (`**text**`)
 * and italic (`_text_`) markers, outputting the appropriate HTML elements.
 *
 * Usage:
 *   <RichText text={t('info', 'mechanism.i.p1')} />
 *
 * Supports nested-ish rendering by splitting on the two patterns in sequence.
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  const segments = text.split(/(\*\*[^*]+\*\*|_[^_]+_)/g)
  const nodes = segments.map((seg, i) => {
    if (seg.startsWith('**') && seg.endsWith('**'))
      return (
        <strong key={i} className="font-semibold text-gray-800 dark:text-gray-200">
          {seg.slice(2, -2)}
        </strong>
      )
    if (seg.startsWith('_') && seg.endsWith('_'))
      return (
        <em key={i} className="italic text-gray-600 dark:text-gray-400">
          {seg.slice(1, -1)}
        </em>
      )
    return seg || null
  })

  if (className) return <span className={className}>{nodes}</span>
  return <>{nodes}</>
}

'use client'

import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

type Props = {
  mantraText: string
  mantraLanguage: string
  ipaText: string
  syllableCount: number
  activeStepCount: number
  overflow: number
  onMantraChange: (text: string) => void
  onLanguageChange: (lang: string) => void
  onIpaChange: (ipa: string) => void
}

export function MantraInput({
  mantraText,
  mantraLanguage,
  ipaText,
  syllableCount,
  activeStepCount,
  overflow,
  onMantraChange,
  onLanguageChange,
  onIpaChange,
}: Props) {
  const [showIpa, setShowIpa] = useState(false)
  const counterText = useMemo(
    () => `${syllableCount} syllables across ${activeStepCount} active steps`,
    [activeStepCount, syllableCount]
  )

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="mantra-input">Phrase or mantra</Label>
        <Textarea
          id="mantra-input"
          rows={2}
          className="mt-1 min-h-0 font-mono"
          value={mantraText}
          onChange={(e) => onMantraChange(e.target.value)}
          placeholder="Use | to mark syllable breaks: re|mem|ber|ing"
        />
      </div>
      <div className="text-xs text-gray-600 dark:text-gray-400">
        {counterText}
        {overflow > 0 ? (
          <span className="ml-2 text-amber-600 dark:text-amber-400">
            {overflow} syllable(s) won&apos;t fit — activate more steps
          </span>
        ) : null}
      </div>
      <div>
        <Label htmlFor="mantra-lang">Language</Label>
        <Input
          id="mantra-lang"
          className="mt-1"
          value={mantraLanguage}
          onChange={(e) => onLanguageChange(e.target.value)}
          placeholder="Language (e.g. English, Yoruba, Thai)"
        />
      </div>
      <div className="space-y-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setShowIpa((v) => !v)}>
          IPA notation - optional
        </Button>
        {showIpa ? (
          <div>
            <Label htmlFor="mantra-ipa">Full IPA transcription</Label>
            <Textarea
              id="mantra-ipa"
              rows={2}
              className="mt-1 min-h-0 font-mono"
              value={ipaText}
              onChange={(e) => onIpaChange(e.target.value)}
              placeholder="/rɪˈmɛmbərɪŋ/"
            />
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-500">
              Use standard IPA characters. This field is for your reference - it is not parsed.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

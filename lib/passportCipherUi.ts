import type { GlossaryWord } from '@/types/Glossary'

/** Encrypted payload is Base64; plaintext personal notes usually have spaces or are shorter. */
export function isUndecipherablePersonalCipher(
  value: string | undefined,
  word: Pick<GlossaryWord, 'encrypted' | 'personal'>
): boolean {
  if (word.personal !== true || word.encrypted !== true) return false
  if (!value || value.length <= 40) return false
  if (/\s/.test(value)) return false
  return true
}

export const ENCRYPTED_FIELD_PLACEHOLDER =
  '[Definition encrypted — key not found.\nRestore your key backup in Settings to read this.]'

/** localStorage: set to `active` when user skips backup; `dismissed` hides My Record nudge */
export const PASSPORT_BACKUP_REMINDER_KEY = 'mm_passport_backup_reminder'

export function displayPersonalLexiconField(
  value: string | undefined,
  word: Pick<GlossaryWord, 'encrypted' | 'personal'>
): string {
  if (!value) return ''
  if (isUndecipherablePersonalCipher(value, word)) return ENCRYPTED_FIELD_PLACEHOLDER
  return value
}

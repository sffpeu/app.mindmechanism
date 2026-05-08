export interface GlossaryWord {
  id: string;
  word: string;
  definition: string;
  grade: number;
  phonetic_spelling: string;
  rating: '+' | '-' | '~';
  source: 'system' | 'user';
  version: 'Default' | 'User';
  /** ISO 639-1 language code — defaults to 'en'. */
  language?: string;
  /** For default words: which clock (0–8) this word belongs to. See clockTitles. */
  clock_id?: number;
  user_id?: string;
  created_at: string;
  /** Optional pre-recorded pronunciation file. Falls back to Web Speech API when absent. */
  audio_url?: string;
}

/**
 * Extended definitions stored in the separate `glossary_definitions` Firestore collection.
 * Document ID matches the corresponding `glossary` document ID.
 *
 * Access is gated by Firestore security rules based on the user's subscription tier:
 *   standard  → request.auth.token.tier in ['standard', 'sovereign']
 *   academic  → request.auth.token.tier == 'sovereign'
 */
export interface GlossaryDefinition {
  word_id: string;
  /** Standard tier — book-level definition (100-word desktop set). */
  standard?: string;
  /** Sovereign tier — deep academic / clinical definition. */
  academic?: string;
}

export type WordRating = '+' | '-' | '~';
export type WordSource = 'system' | 'user';
export type WordVersion = 'Default' | 'User';

/** Languages supported by the Free Dictionary API for IPA auto-fetch. */
export const SUPPORTED_LANGUAGES: Array<{ code: string; name: string }> = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'ru', name: 'Russian' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'tr', name: 'Turkish' },
  { code: 'zh', name: 'Chinese (Mandarin)' },
  { code: 'other', name: 'Other / enter IPA manually' },
]

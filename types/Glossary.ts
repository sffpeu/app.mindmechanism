export interface GlossaryWord {
  id: string;
  word: string;
  definition: string;
  grade: number;
  phonetic_spelling: string;
  rating: '+' | '-' | '~';
  source: 'system' | 'user';
  version: 'Default' | 'User';
  /** For default words: which clock (0–8) this word belongs to. See clockTitles. */
  clock_id?: number;
  user_id?: string;
  created_at: string;
}

export type WordRating = '+' | '-' | '~';
export type WordSource = 'system' | 'user';
export type WordVersion = 'Default' | 'User'; 
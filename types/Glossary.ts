export interface GlossaryWord {
  id: string;
  word: string;
  definition: string;
  grade: number;
  phonetic_spelling: string;
  rating: '+' | '-' | '~';
  source: 'system' | 'user';
  version: 'Default' | string;
  user_id?: string;
  created_at: string;
}

export type WordRating = '+' | '-' | '~';
export type WordSource = 'System' | string;
export type WordVersion = 'Default' | string; 
export interface Word {
  word: string;
  phonetic: string;
  definition: string;
  rating: number;
  type: 'Positive' | 'Neutral' | 'Negative';
}

import { parseCSV } from './parseWords';

let cachedWords: Word[] | null = null;

export async function loadWords(): Promise<Word[]> {
  if (!cachedWords) {
    cachedWords = await parseCSV();
  }
  return cachedWords;
}

// Function to get words for a specific clock
export async function getClockWords(clockId: string): Promise<Word[]> {
  const words = await loadWords();
  return words.filter((word: Word) => {
    const rating = Number(word.rating);
    if (clockId === "clock1") {
      return rating === 5;
    } else if (clockId === "clock2") {
      return rating === 3;
    } else if (clockId === "clock3") {
      return rating === 1;
    }
    return false;
  });
}

export async function getAllWords(): Promise<Word[]> {
  return loadWords();
} 
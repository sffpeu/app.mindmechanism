export interface Word {
  word: string;
  phonetic: string;
  definition: string;
  rating: number;
  type: 'Positive' | 'Neutral' | 'Negative';
}

import { parseCSV } from './parseWords';

export async function loadWords(): Promise<Word[]> {
  return parseCSV();
}

// Function to get words for a specific clock
export function getClockWords(clockId: string): Word[] {
  return initialWords.filter(word => {
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

export function getAllWords(): Word[] {
  return initialWords;
} 
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export interface Word {
  word: string;
  phonetic: string;
  definition: string;
  rating: number;
  type: 'Positive' | 'Neutral' | 'Negative';
}

export async function loadWords(): Promise<Word[]> {
  try {
    const response = await fetch('/api/words');
    if (!response.ok) {
      throw new Error('Failed to fetch words');
    }
    return response.json();
  } catch (error) {
    console.error('Error loading words:', error);
    return [];
  }
}

function determineRating(type: string): number {
  const normalizedType = type.toLowerCase();
  if (normalizedType.includes('positive')) return 5;
  if (normalizedType.includes('neutral')) return 3;
  if (normalizedType.includes('negative')) return 1;
  return 3; // Default to neutral
}

function determineType(type: string): 'Positive' | 'Neutral' | 'Negative' {
  const normalizedType = type.toLowerCase();
  if (normalizedType.includes('positive')) return 'Positive';
  if (normalizedType.includes('negative')) return 'Negative';
  return 'Neutral';
}

// Function to get words for a specific clock
export function getClockWords(clockId: number, words: Word[]): string[] {
  // Filter words based on type and rating
  let filteredWords: Word[] = [];
  
  switch(clockId) {
    case 0: // Achievement-focused words
      filteredWords = words.filter(w => w.type === 'Positive' && w.rating === 5);
      break;
    case 1: // Balanced words
      filteredWords = words.filter(w => w.type === 'Neutral');
      break;
    case 2: // Dynamic words
      filteredWords = words.filter(w => w.rating >= 3);
      break;
    case 3: // Transformative words
      filteredWords = words.filter(w => w.type === 'Positive');
      break;
    case 4: // Growth words
      filteredWords = words.filter(w => w.rating >= 4);
      break;
    case 5: // Intuitive words
      filteredWords = words.filter(w => w.type !== 'Negative');
      break;
    case 6: // Spiritual words
      filteredWords = words.filter(w => w.type === 'Positive' && w.rating === 5);
      break;
    case 7: // Harmony words
      filteredWords = words.filter(w => w.type === 'Positive');
      break;
    case 8: // Wisdom words
      filteredWords = words.filter(w => w.type === 'Positive' && w.rating >= 4);
      break;
    default:
      filteredWords = words;
  }
  
  return filteredWords.map(w => w.word);
} 
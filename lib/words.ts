export interface Word {
  word: string;
  phonetic: string;
  definition: string;
  rating: number;
  type: 'Positive' | 'Neutral' | 'Negative';
  version: 'Default' | string;
}

// Initial array of all words
const initialWords: Word[] = [
  {
    word: 'Apathy',
    phonetic: '/ˈæpəθi/',
    definition: 'Lack of interest, enthusiasm, or concern.',
    rating: 2,
    type: 'Negative',
    version: 'Default'
  },
  // ... rest of the words ...
];

// Find and log duplicates
const wordCounts = new Map<string, number>();
initialWords.forEach(w => {
  const count = wordCounts.get(w.word) || 0;
  wordCounts.set(w.word, count + 1);
});

const duplicates = Array.from(wordCounts.entries())
  .filter(([_, count]) => count > 1)
  .map(([word]) => word);

if (duplicates.length > 0) {
  console.warn('Found duplicate words:', duplicates);
}

// Create a Set to store unique words and remove duplicates
const uniqueWords = [...new Set(initialWords.map(w => w.word))]
  .map(word => initialWords.find(w => w.word === word)!)
  .sort((a, b) => a.word.localeCompare(b.word)) // Sort alphabetically
  .slice(0, 475);

console.log(`Total unique words: ${uniqueWords.length}`);

// Export the unique words array
export const words: Word[] = uniqueWords;

export async function loadWords(): Promise<Word[]> {
  return words;
}

export async function getClockWords(): Promise<Word[]> {
  return words
    .filter(word => word.rating >= 4)
    .sort((a, b) => a.word.localeCompare(b.word)); // Sort alphabetically
}

export async function getAllWords(): Promise<Word[]> {
  return words.sort((a, b) => a.word.localeCompare(b.word)); // Sort alphabetically
}

// Add function to get words by version
export async function getWordsByVersion(version: string = 'Default'): Promise<Word[]> {
  return words
    .filter(word => word.version === version)
    .sort((a, b) => a.word.localeCompare(b.word)); // Sort alphabetically
} 
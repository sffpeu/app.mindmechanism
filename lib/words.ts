export interface Word {
  word: string;
  phonetic: string;
  definition: string;
  rating: number;
  type: 'Positive' | 'Neutral' | 'Negative';
}

// Hardcode the words for now (we can move this to Supabase later)
export const initialWords: Word[] = [
  {
    word: 'A cut above',
    phonetic: '/ə kʌt əˈbʌv/',
    definition: 'Significantly better than others.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Absolute',
    phonetic: '/æbsəluːt/',
    definition: 'Not qualified or diminished in any way',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Absurdity',
    phonetic: '/əbsɜːrdɪti/',
    definition: 'The quality or state of being ridiculous or wildly unreasonable.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Abuse',
    phonetic: '/əbjuːs/',
    definition: 'The improper use of something.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Abusiveness',
    phonetic: '/əbjuːsɪvnəs/',
    definition: 'The bad quality of being abusive towards someone or something.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Acceptance',
    phonetic: '/əkseptəns/',
    definition: 'The action of consenting to receive or undertake something offered.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Accurate',
    phonetic: '/ækjʊrət/',
    definition: 'Correct in all details',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Achievement',
    phonetic: '/ətʃiːvmənt/',
    definition: 'A successful result gained through effort.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Adaptability',
    phonetic: '/əˌdæptəˈbɪlɪti/',
    definition: 'The quality of being able to adjust to new conditions.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Adapting',
    phonetic: '/əˈdæptɪŋ/',
    definition: 'The act of making something suitable for a new use or purpose.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Adequacy',
    phonetic: '/ædɪkwəsi/',
    definition: 'The state of being sufficient for the purpose concerned.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Advantage',
    phonetic: '/ədvæntɪdʒ/',
    definition: 'A condition or circumstance that puts one in a favorable or superior position.',
    rating: 5,
    type: 'Positive'
  }
];

export async function loadWords(): Promise<Word[]> {
  // For now, return the hardcoded words
  // Later, we can fetch from Supabase here
  return initialWords;
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
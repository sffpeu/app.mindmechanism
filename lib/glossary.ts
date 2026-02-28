import { db } from './firebase';
import { GlossaryWord, WordRating } from '@/types/Glossary';
import { 
  collection,
  query as firestoreQuery,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  where,
  orderBy,
  Firestore
} from 'firebase/firestore';
import { testWords } from '@/lib/testWords';

/** Words that appear under Default > ROOT in the glossary (clock_id 0). */
export const ROOT_DEFAULT_WORDS: readonly string[] = [
  'Achievement',
  'Willingness',
  'Vitality',
  'Boldness',
  'Insight',
  'Command',
  'Reflection',
  'Illusion'
];

/** Words that appear under Default > SACROL in the glossary (clock_id 1). */
export const SACROL_DEFAULT_WORDS: readonly string[] = [
  'Union',
  'Sturdiness',
  'Insightful',
  'Modesty',
  'Surprise',
  'Joyless'
];

/** Words that appear under Default > SOLAR PLEXUS in the glossary (clock_id 2). */
export const SOLAR_PLEXUS_DEFAULT_WORDS: readonly string[] = [
  'Rampant',
  'Causing',
  'Salvage',
  'Roaring',
  'Pretentions',
  'Salaciousness',
  'Aim',
  'Rebirth',
  'Exuberance',
  'Urge'
];

/** Words that appear under Default > HEART in the glossary (clock_id 3). */
export const HEART_DEFAULT_WORDS: readonly string[] = [
  'Balancing',
  'Submerging',
  'Attracting',
  'Curiosity',
  'Colliding',
  'Concern',
  'Fate',
  'Overbearing',
  'Life force',
  'Protecting',
  'Triumphing',
  'Preening'
];

/** Words that appear under Default > THROAT in the glossary (clock_id 4). */
export const THROAT_DEFAULT_WORDS: readonly string[] = [
  'Resonating',
  'Immersing',
  'Righteous',
  'Compulsion',
  'Yearning',
  'Adapting',
  'Fostering',
  'Flaunting',
  'Advocating',
  'Beguiling',
  'Crippling',
  'Repairing',
  'Transforming',
  'Suspension',
  'Replanting',
  'Reprocessing'
];

/** Words that appear under Default > THIRD EYE in the glossary (clock_id 5). */
export const THIRD_EYE_DEFAULT_WORDS: readonly string[] = [
  'Child-like',
  'Unveiling',
  'Flight',
  'Premonition'
];

/** Words that appear under Default > MALE CROWN in the glossary (clock_id 6). */
export const MALE_CROWN_DEFAULT_WORDS: readonly string[] = [
  'Seeking',
  'Idealism',
  'Surrendering',
  'Bliss',
  'Spontaneity',
  'Discourse',
  'Empathy',
  'Righteousness',
  'Prayer',
  'Majesty',
  'Praise',
  'Libation',
  'Atonement',
  'Ceremony',
  'Temperance',
  'Release'
];

/** Words that appear under Default > FEMALE CROWN in the glossary (clock_id 7). */
export const FEMALE_CROWN_DEFAULT_WORDS: readonly string[] = [
  'Infinity',
  'Weaving love',
  'Vibrating',
  'Core centring',
  'Purification',
  'Stability',
  'Kindness',
  'Transformation',
  'Self love',
  'Pure being',
  'Limitlessness',
  'Contingency',
  'Sensual',
  'Effort',
  'Innovating',
  'Heritage'
];

/** Words that appear under Default > ETHERAL HEART in the glossary (clock_id 8). */
export const ETHERAL_HEART_DEFAULT_WORDS: readonly string[] = [
  'Father',
  'Son',
  'Spirit'
];

function assignDefaultClockIds(words: GlossaryWord[]): GlossaryWord[] {
  const rootSet = new Set(ROOT_DEFAULT_WORDS.map(w => w.toLowerCase()));
  const sacrolSet = new Set(SACROL_DEFAULT_WORDS.map(w => w.toLowerCase()));
  const solarPlexusSet = new Set(SOLAR_PLEXUS_DEFAULT_WORDS.map(w => w.toLowerCase()));
  const heartSet = new Set(HEART_DEFAULT_WORDS.map(w => w.toLowerCase()));
  const throatSet = new Set(THROAT_DEFAULT_WORDS.map(w => w.toLowerCase()));
  const thirdEyeSet = new Set(THIRD_EYE_DEFAULT_WORDS.map(w => w.toLowerCase()));
  const maleCrownSet = new Set(MALE_CROWN_DEFAULT_WORDS.map(w => w.toLowerCase()));
  const femaleCrownSet = new Set(FEMALE_CROWN_DEFAULT_WORDS.map(w => w.toLowerCase()));
  const etherealHeartSet = new Set(ETHERAL_HEART_DEFAULT_WORDS.map(w => w.toLowerCase()));
  return words.map(w => {
    const lower = w.word.toLowerCase();
    if (rootSet.has(lower)) return { ...w, clock_id: 0 };
    if (sacrolSet.has(lower)) return { ...w, clock_id: 1 };
    if (solarPlexusSet.has(lower)) return { ...w, clock_id: 2 };
    if (heartSet.has(lower)) return { ...w, clock_id: 3 };
    if (throatSet.has(lower)) return { ...w, clock_id: 4 };
    if (thirdEyeSet.has(lower)) return { ...w, clock_id: 5 };
    if (maleCrownSet.has(lower)) return { ...w, clock_id: 6 };
    if (femaleCrownSet.has(lower)) return { ...w, clock_id: 7 };
    if (etherealHeartSet.has(lower)) return { ...w, clock_id: 8 };
    return w;
  });
}

// Maximum number of retries for Firestore operations
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper function to create default glossary words
function createDefaultGlossaryWords(): GlossaryWord[] {
  return testWords.map((word, index) => ({
    id: `default-${index}`,
    word,
    definition: word,
    phonetic_spelling: word,
    grade: 1,
    rating: '+',
    version: 'Default',
    created_at: new Date().toISOString(),
    source: 'system'
  }));
}

// Helper function to retry Firestore operations
async function retryOperation<T>(
  operation: () => Promise<T>,
  retryCount = 0
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying operation (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return retryOperation(operation, retryCount + 1);
    }
    throw error;
  }
}

export async function getAllWords(): Promise<GlossaryWord[]> {
  try {
    if (!db) {
      console.warn('Firestore is not initialized, using default words');
      return createDefaultGlossaryWords();
    }

    const operation = async () => {
      const glossaryRef = collection(db as Firestore, 'glossary');
      const q = firestoreQuery(glossaryRef, orderBy('word'));
      const querySnapshot = await getDocs(q);
      const words = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GlossaryWord[];

      if (words.length === 0) {
        console.warn('No words found in glossary, using default words');
        return createDefaultGlossaryWords();
      }

      return assignDefaultClockIds(words);
    };

    return await retryOperation(operation);
  } catch (error) {
    console.error('Error fetching words:', error);
    return createDefaultGlossaryWords();
  }
}

export async function getWordsByRating(rating: string): Promise<GlossaryWord[]> {
  try {
    if (!db) {
      console.warn('Firestore is not initialized, using default words');
      return createDefaultGlossaryWords().filter(word => word.rating === rating);
    }

    const operation = async () => {
      const glossaryRef = collection(db as Firestore, 'glossary');
      const q = firestoreQuery(
        glossaryRef,
        where('rating', '==', rating),
        orderBy('word')
      );
      const querySnapshot = await getDocs(q);
      const words = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GlossaryWord[];

      if (words.length === 0) {
        console.warn('No words found for rating, using filtered default words');
        return createDefaultGlossaryWords().filter(word => word.rating === rating);
      }

      return assignDefaultClockIds(words);
    };

    return await retryOperation(operation);
  } catch (error) {
    console.error('Error fetching words by rating:', error);
    return createDefaultGlossaryWords().filter(word => word.rating === rating);
  }
}

export async function getClockWords(): Promise<GlossaryWord[]> {
  try {
    if (!db) {
      console.warn('Firestore is not initialized, using default words');
      return createDefaultGlossaryWords();
    }

    const operation = async () => {
      const glossaryRef = collection(db as Firestore, 'glossary');
      const q = firestoreQuery(
        glossaryRef,
        orderBy('word')
      );
      const querySnapshot = await getDocs(q);
      const words = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GlossaryWord[];

      if (words.length === 0) {
        console.warn('No words found in glossary, using default words');
        return createDefaultGlossaryWords();
      }

      return assignDefaultClockIds(words);
    };

    return await retryOperation(operation);
  } catch (error) {
    console.error('Error fetching clock words:', error);
    return createDefaultGlossaryWords();
  }
}

export async function addUserWord(word: Omit<GlossaryWord, 'id' | 'created_at'>): Promise<GlossaryWord | null> {
  try {
    if (!db) throw new Error('Firestore is not initialized');

    const glossaryRef = collection(db as Firestore, 'glossary');
    const docRef = await addDoc(glossaryRef, {
      ...word,
      created_at: new Date().toISOString()
    });

    return {
      id: docRef.id,
      ...word,
      created_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error adding word:', error);
    return null;
  }
}

export async function updateUserWord(id: string, updates: Partial<GlossaryWord>): Promise<GlossaryWord | null> {
  try {
    if (!db) throw new Error('Firestore is not initialized');

    const docRef = doc(db as Firestore, 'glossary', id);
    await updateDoc(docRef, updates);

    return {
      id,
      ...updates,
    } as GlossaryWord;
  } catch (error) {
    console.error('Error updating word:', error);
    return null;
  }
}

export async function deleteUserWord(id: string): Promise<boolean> {
  try {
    if (!db) throw new Error('Firestore is not initialized');

    const docRef = doc(db as Firestore, 'glossary', id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting word:', error);
    return false;
  }
}

export async function searchWords(searchText: string): Promise<GlossaryWord[]> {
  try {
    if (!db) throw new Error('Firestore is not initialized');

    // Note: Firestore doesn't support case-insensitive search out of the box
    // For a production app, you might want to use Algolia or a similar search service
    // This is a simple implementation that will only match exact substrings
    const glossaryRef = collection(db as Firestore, 'glossary');
    const q = firestoreQuery(glossaryRef, orderBy('word'));
    const querySnapshot = await getDocs(q);
    
    const searchQuery = searchText.toLowerCase();
    const results = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }) as GlossaryWord)
      .filter(word =>
        word.word.toLowerCase().includes(searchQuery) ||
        word.definition.toLowerCase().includes(searchQuery)
      );
    return assignDefaultClockIds(results);
  } catch (error) {
    console.error('Error searching words:', error);
    return [];
  }
} 
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

      return words;
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

      return words;
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

      return words;
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
    return querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }) as GlossaryWord)
      .filter(word => 
        word.word.toLowerCase().includes(searchQuery) ||
        word.definition.toLowerCase().includes(searchQuery)
      );
  } catch (error) {
    console.error('Error searching words:', error);
    return [];
  }
} 
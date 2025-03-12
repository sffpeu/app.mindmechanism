import { db } from './firebase';
import { GlossaryWord, WordRating } from '@/types/Glossary';
import { 
  collection,
  query,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  where,
  orderBy,
  Firestore
} from 'firebase/firestore';

export async function getAllWords(): Promise<GlossaryWord[]> {
  try {
    if (!db) throw new Error('Firestore is not initialized');

    const glossaryRef = collection(db as Firestore, 'glossary');
    const q = query(glossaryRef, orderBy('word'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GlossaryWord[];
  } catch (error) {
    console.error('Error fetching words:', error);
    return [];
  }
}

export async function getWordsByRating(rating: string): Promise<GlossaryWord[]> {
  try {
    if (!db) throw new Error('Firestore is not initialized');

    const glossaryRef = collection(db as Firestore, 'glossary');
    const q = query(
      glossaryRef,
      where('rating', '==', rating),
      orderBy('word')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GlossaryWord[];
  } catch (error) {
    console.error('Error fetching words by rating:', error);
    return [];
  }
}

export async function getClockWords(): Promise<GlossaryWord[]> {
  try {
    if (!db) throw new Error('Firestore is not initialized');

    const glossaryRef = collection(db as Firestore, 'glossary');
    const q = query(
      glossaryRef,
      where('grade', '>=', 4),
      orderBy('grade'),
      orderBy('word')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GlossaryWord[];
  } catch (error) {
    console.error('Error fetching clock words:', error);
    return [];
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

export async function searchWords(query: string): Promise<GlossaryWord[]> {
  try {
    if (!db) throw new Error('Firestore is not initialized');

    // Note: Firestore doesn't support case-insensitive search out of the box
    // For a production app, you might want to use Algolia or a similar search service
    // This is a simple implementation that will only match exact substrings
    const glossaryRef = collection(db as Firestore, 'glossary');
    const q = query(glossaryRef, orderBy('word'));
    const querySnapshot = await getDocs(q);
    
    const searchQuery = query.toLowerCase();
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
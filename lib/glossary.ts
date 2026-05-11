import { db } from './firebase';
import { GlossaryWord, GlossaryDefinition } from '@/types/Glossary';
import type { UserProfile } from '@/lib/FirebaseAuthContext';
import { logWheelAssignment } from '@/lib/researchLogging';
import { encryptField, loadKey, decryptField } from '@/lib/passportCrypto';
import { bumpPassportLexiconCount, syncPassportKeyMeta } from '@/lib/passportSilo';
import { maybeAutoAnchor } from '@/lib/lexiconAnchor';
import { testWords } from '@/lib/testWords';
import {
  collection,
  query as firestoreQuery,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  where,
  orderBy,
  Firestore
} from 'firebase/firestore';

export type SaveUserWordOptions = {
  researchContext?: { uid: string; profile: UserProfile | null }
  /** When set, used to encrypt personal fields; if omitted, personal narrative is stored plaintext (legacy). */
  passportKey?: CryptoKey | null
}

/**
 * Fetch IPA phonetic spelling from the Free Dictionary API.
 * Returns the IPA string on success, empty string if not found or language unsupported.
 * Languages supported by the API: en, es, fr, de, it, pt-BR, ru, ar, hi, ja, ko, tr.
 */
export async function fetchIpaPhonetic(word: string, language: string = 'en'): Promise<string> {
  if (!word.trim() || language === 'other') return ''
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/${language}/${encodeURIComponent(word.toLowerCase().trim())}`,
      { signal: AbortSignal.timeout(4000) }
    )
    if (!res.ok) return ''
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) return ''
    // Prefer a phonetic entry that has IPA text
    const phonetics: Array<{ text?: string }> = data[0]?.phonetics ?? []
    const ipaEntry = phonetics.find((p) => p.text?.startsWith('/') || p.text?.startsWith('['))
    return ipaEntry?.text ?? data[0]?.phonetic ?? ''
  } catch {
    return ''
  }
}

/**
 * Fetch extended definition tiers from the separate `glossary_definitions` collection.
 * Returns null if the document doesn't exist or access is denied by Firestore rules.
 *
 * Firestore security rules pattern (to add when subscription system is in place):
 *   match /glossary_definitions/{wordId} {
 *     allow read: if request.auth != null &&
 *       request.auth.token.tier in ['standard', 'sovereign'];
 *   }
 */
export async function getWordDefinition(wordId: string): Promise<GlossaryDefinition | null> {
  try {
    if (!db) return null
    const docRef = doc(db as Firestore, 'glossary_definitions', wordId)
    const snap = await getDoc(docRef)
    if (!snap.exists()) return null
    return { word_id: wordId, ...snap.data() } as GlossaryDefinition
  } catch {
    return null
  }
}

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

/** Words that appear under Default > ETHERIC HEART in the glossary (clock_id 8). */
export const ETHERIC_HEART_DEFAULT_WORDS: readonly string[] = [
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
  const ethericHeartSet = new Set(ETHERIC_HEART_DEFAULT_WORDS.map(w => w.toLowerCase()));
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
    if (ethericHeartSet.has(lower)) return { ...w, clock_id: 8 };
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

export async function decryptPersonalWord(word: GlossaryWord): Promise<GlossaryWord> {
  if (!word.encrypted || (!word.own_definition && !word.context)) return word
  const key = await loadKey()
  if (!key) return word

  const decrypted = { ...word }
  if (word.own_definition) {
    try {
      decrypted.own_definition = await decryptField(word.own_definition, key)
    } catch {
      /* leave ciphertext */
    }
  }
  if (word.context) {
    try {
      decrypted.context = await decryptField(word.context, key)
    } catch {
      /* leave ciphertext */
    }
  }
  return decrypted
}

async function decryptPersonalWordsInList(words: GlossaryWord[]): Promise<GlossaryWord[]> {
  return Promise.all(words.map((w) => (w.personal === true ? decryptPersonalWord(w) : w)))
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

    const raw = await retryOperation(operation);
    return assignDefaultClockIds(await decryptPersonalWordsInList(raw));
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

    const raw = await retryOperation(operation);
    return assignDefaultClockIds(await decryptPersonalWordsInList(raw));
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

    const raw = await retryOperation(operation);
    return assignDefaultClockIds(await decryptPersonalWordsInList(raw));
  } catch (error) {
    console.error('Error fetching clock words:', error);
    return createDefaultGlossaryWords();
  }
}

export async function addUserWord(
  word: Omit<GlossaryWord, 'id' | 'created_at'>,
  options?: SaveUserWordOptions
): Promise<GlossaryWord | null> {
  try {
    if (!db) throw new Error('Firestore is not initialized');

    const glossaryRef = collection(db as Firestore, 'glossary');
    let payload: Record<string, unknown> = { ...word };
    let storedEncrypted = false;

    if (word.personal === true && (word.own_definition || word.context)) {
      const key = options?.passportKey ?? null;
      if (key) {
        const uid = word.user_id ?? options?.researchContext?.uid;
        if (uid) await syncPassportKeyMeta(uid, key);
        if (word.own_definition) {
          payload.own_definition = await encryptField(word.own_definition, key);
        }
        if (word.context) {
          payload.context = await encryptField(word.context, key);
        }
        payload.encrypted = true;
        storedEncrypted = true;
      }
    } else if (word.personal === true) {
      payload.encrypted = false;
    }

    const created_at = new Date().toISOString();
    const docRef = await addDoc(glossaryRef, {
      ...payload,
      created_at,
    });

    if (word.personal === true && typeof word.user_id === 'string') {
      await bumpPassportLexiconCount(word.user_id, 1);
      const pref = doc(db as Firestore, 'passport', word.user_id);
      const psnap = await getDoc(pref);
      const rawCount = psnap.data()?.lexicon_count;
      const count = typeof rawCount === 'number' ? rawCount : 0;
      maybeAutoAnchor(word.user_id, count);
    }

    const researchContext = options?.researchContext;
    if (researchContext && word.clock_id != null) {
      await logWheelAssignment(researchContext.uid, researchContext.profile, {
        wheelIndex: word.clock_id,
        language: word.language ?? 'und',
        grade: word.grade ?? 0,
      })
    }

    return {
      id: docRef.id,
      ...word,
      created_at,
      ...(storedEncrypted ? { encrypted: true as const } : word.personal ? { encrypted: false as const } : {}),
    };
  } catch (error) {
    console.error('Error adding word:', error);
    return null;
  }
}

export async function updateUserWord(
  id: string,
  updates: Partial<GlossaryWord>,
  options?: SaveUserWordOptions
): Promise<GlossaryWord | null> {
  try {
    if (!db) throw new Error('Firestore is not initialized');

    const docRef = doc(db as Firestore, 'glossary', id);
    let patch: Record<string, unknown> = { ...updates };

    if (updates.personal === true && (updates.own_definition !== undefined || updates.context !== undefined)) {
      const own = updates.own_definition ?? '';
      const ctx = updates.context ?? '';
      const key = options?.passportKey ?? null;
      if (own || ctx) {
        if (key) {
          const uid = options?.researchContext?.uid;
          if (uid) await syncPassportKeyMeta(uid, key);
          patch = { ...updates };
          patch.own_definition = own ? await encryptField(own, key) : '';
          patch.context = ctx ? await encryptField(ctx, key) : '';
          patch.encrypted = true;
        } else {
          patch = { ...updates };
          patch.encrypted = false;
        }
      } else {
        patch = { ...updates, encrypted: false, own_definition: '', context: '' };
      }
    } else if (updates.personal === false) {
      patch = { ...updates, encrypted: false };
    }

    await updateDoc(docRef, patch as Partial<GlossaryWord> & Record<string, unknown>);

    const researchContext = options?.researchContext;
    if (researchContext && updates.clock_id != null) {
      await logWheelAssignment(researchContext.uid, researchContext.profile, {
        wheelIndex: updates.clock_id,
        language: updates.language ?? 'und',
        grade: updates.grade ?? 0,
      })
    }

    return {
      id,
      ...updates,
      ...(typeof patch.encrypted === 'boolean' ? { encrypted: patch.encrypted } : {}),
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
    const snap = await getDoc(docRef);
    const data = snap.data() as { personal?: boolean; user_id?: string } | undefined;
    await deleteDoc(docRef);
    if (data?.personal === true && typeof data.user_id === 'string') {
      await bumpPassportLexiconCount(data.user_id, -1);
    }
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
        word.definition.toLowerCase().includes(searchQuery) ||
        (word.own_definition ?? '').toLowerCase().includes(searchQuery) ||
        (word.context ?? '').toLowerCase().includes(searchQuery)
      );
    return assignDefaultClockIds(await decryptPersonalWordsInList(results));
  } catch (error) {
    console.error('Error searching words:', error);
    return [];
  }
} 
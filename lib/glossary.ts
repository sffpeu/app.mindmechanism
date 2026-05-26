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

// ─── IPA phonetics layer ──────────────────────────────────────────────────
// Free Dictionary API (dictionaryapi.dev) supported language codes
const IPA_API_LANGS = new Set(['en', 'es', 'fr', 'de', 'it', 'pt-BR', 'ru', 'ar', 'hi', 'ja', 'ko', 'tr'])
// v2: bumped from v1 to discard old API-only miss sentinels so rule-based
//     fallback is now applied to previously-missed words on next load.
const IPA_CACHE_NS = 'mm_ipa_v2'
const IPA_MISS = '\x00' // sentinel: both API and rule-based returned nothing

function ipaKey(lang: string, word: string) {
  return `${IPA_CACHE_NS}:${lang}:${word.toLowerCase()}`
}
function getIpaCached(lang: string, word: string): string | null {
  if (typeof window === 'undefined') return null
  const v = window.localStorage.getItem(ipaKey(lang, word))
  if (v === null) return null
  return v === IPA_MISS ? '' : v
}
function setIpaCached(lang: string, word: string, ipa: string) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(ipaKey(lang, word), ipa || IPA_MISS) } catch { /* quota */ }
}

// ─── Rule-based phonemic transcription ────────────────────────────────────
// Used as fallback when the Dictionary API has no entry for a word — covers
// user-invented terms, technical vocabulary, and languages with sparse API
// coverage. Accuracy is practical rather than academic.

/** Finnish: near-perfect phoneme-grapheme correspondence */
function finnishPhonemic(word: string): string {
  const s = word.toLowerCase()
    .replace(/aa/g, 'aː').replace(/ee/g, 'eː').replace(/ii/g, 'iː')
    .replace(/oo/g, 'oː').replace(/uu/g, 'uː')
    .replace(/ää/g, 'æː').replace(/öö/g, 'øː').replace(/yy/g, 'yː')
    .replace(/([bcdfghjklmnpqrstvwxz])\1/g, '$1ː')
    .replace(/ng/g, 'ŋ').replace(/nk/g, 'ŋk')
    .replace(/ä/g, 'æ').replace(/ö/g, 'ø')
  return `/${s}/`
}

/** German: covers major letter-sound correspondences */
function germanPhonemic(word: string): string {
  let s = word.toLowerCase()
  // Multi-char clusters — longest first
  s = s.replace(/tsch/g, 'tʃ')
  s = s.replace(/sch/g, 'ʃ')
  s = s.replace(/chs/g, 'ks')
  s = s.replace(/pf/g, 'pf')
  s = s.replace(/qu/g, 'kv')
  s = s.replace(/tz/g, 'ts')
  // Diphthongs
  s = s.replace(/ei|ai|ay|ey/g, 'aɪ')
  s = s.replace(/eu|äu/g, 'ɔɪ')
  s = s.replace(/au/g, 'aʊ')
  s = s.replace(/ie/g, 'iː')
  // ch: after back vowels → x, elsewhere → ç
  s = s.replace(/([aouaɪɔɪaʊ])ch/g, '$1x')
  s = s.replace(/ch/g, 'ç')
  // Word-initial sp/st → ʃp/ʃt
  s = s.replace(/\bsp/g, 'ʃp')
  s = s.replace(/\bst/g, 'ʃt')
  // ng/nk
  s = s.replace(/nk/g, 'ŋk')
  s = s.replace(/ng/g, 'ŋ')
  // Umlauts and ß
  s = s.replace(/ä/g, 'ɛ').replace(/ö/g, 'ø').replace(/ü/g, 'y')
  s = s.replace(/ß/g, 's')
  // Common word endings
  s = s.replace(/ung\b/g, 'ʊŋ')
  s = s.replace(/ig\b/g, 'ɪç')
  s = s.replace(/er\b/g, 'ɐ')
  // Single-letter correspondences
  s = s.replace(/w/g, 'v')
  s = s.replace(/\bv/g, 'f')
  s = s.replace(/z/g, 'ts')
  // Final -e → schwa
  s = s.replace(/e\b/g, 'ə')
  return `/${s}/`
}

/** French: covers major grapheme-phoneme rules including nasal vowels */
function frenchPhonemic(word: string): string {
  let s = word.toLowerCase()
  // Accented vowels first (before digraph rules)
  s = s.replace(/é/g, 'e').replace(/[èêë]/g, 'ɛ')
  s = s.replace(/â/g, 'ɑ').replace(/à/g, 'a')
  s = s.replace(/ô/g, 'o')
  s = s.replace(/[îï]/g, 'i')
  s = s.replace(/[ûù]/g, 'y')
  s = s.replace(/ü/g, 'y')
  s = s.replace(/ç/g, 's')
  // Nasal vowels — check before consuming vowel letters
  s = s.replace(/ain|aim|ein|ien/g, 'ɛ̃')
  s = s.replace(/un\b|um\b/g, 'œ̃')
  s = s.replace(/[ae]n\b|[ae]m\b/g, 'ɑ̃')
  s = s.replace(/on\b|om\b/g, 'ɔ̃')
  // Vocalic digraphs
  s = s.replace(/eau|au/g, 'o')
  s = s.replace(/ou/g, 'u')
  s = s.replace(/oeu|eu/g, 'ø')
  s = s.replace(/oi/g, 'wa')
  s = s.replace(/ai|ei/g, 'ɛ')
  // Consonant digraphs
  s = s.replace(/ch/g, 'ʃ')
  s = s.replace(/ph/g, 'f')
  s = s.replace(/gn/g, 'ɲ')
  s = s.replace(/qu/g, 'k')
  s = s.replace(/ill/g, 'ij')
  // r → uvular
  s = s.replace(/r/g, 'ʁ')
  // g/c before front vowels
  s = s.replace(/g([eɛi])/g, 'ʒ$1')
  s = s.replace(/c([eɛi])/g, 's$1')
  // j → ʒ
  s = s.replace(/j/g, 'ʒ')
  // Silent final consonants
  s = s.replace(/[dtsxz]\b/g, '')
  // Final -er/-ez → e
  s = s.replace(/[eɛ]ʁ\b/g, 'e')
  return `/${s}/`
}

/** Spanish: very regular — one of the most phonemically consistent languages */
function spanishPhonemic(word: string): string {
  let s = word.toLowerCase()
  // Strip accent diacritics (mark stress only, same phoneme)
  s = s.replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
    .replace(/ó/g, 'o').replace(/[úü]/g, 'u')
  // Special digraphs
  s = s.replace(/ñ/g, 'ɲ')
  s = s.replace(/ll/g, 'ʎ')
  s = s.replace(/ch/g, 'tʃ')
  s = s.replace(/rr/g, 'r')
  // qu/gu before e/i → k/g
  s = s.replace(/qu([ei])/g, 'k$1')
  s = s.replace(/gu([ei])/g, 'g$1')
  // c before e/i → s (broad; Castilian uses θ)
  s = s.replace(/c([ei])/g, 's$1')
  // g before e/i → x
  s = s.replace(/g([ei])/g, 'x$1')
  // Single-letter correspondences
  s = s.replace(/j/g, 'x')
  s = s.replace(/h/g, '')
  s = s.replace(/v/g, 'b')
  s = s.replace(/z/g, 's')
  s = s.replace(/x/g, 'ks')
  s = s.replace(/y/g, 'j')
  return `/${s}/`
}

/** Italian: regular with key palatal and affricate rules */
function italianPhonemic(word: string): string {
  let s = word.toLowerCase()
  // Geminate clusters
  s = s.replace(/cch/g, 'kː')
  s = s.replace(/ggh/g, 'gː')
  // sci/sce → ʃ
  s = s.replace(/sci([aeiou])/g, 'ʃ$1')
  s = s.replace(/sce/g, 'ʃe').replace(/sci/g, 'ʃi')
  s = s.replace(/sch/g, 'sk')
  // ch → k, gh → g (hard sounds before front vowels)
  s = s.replace(/ch/g, 'k')
  s = s.replace(/gh/g, 'g')
  // ci/ce → tʃ
  s = s.replace(/ci([aou])/g, 'tʃ$1')
  s = s.replace(/ce/g, 'tʃe').replace(/ci/g, 'tʃi')
  // gi/ge → dʒ
  s = s.replace(/gi([aou])/g, 'dʒ$1')
  s = s.replace(/ge/g, 'dʒe').replace(/gi/g, 'dʒi')
  // gli → ʎ, gn → ɲ
  s = s.replace(/gli/g, 'ʎ')
  s = s.replace(/gn/g, 'ɲ')
  // zz/z → ts
  s = s.replace(/zz/g, 'tsː')
  s = s.replace(/z/g, 'ts')
  // Double consonants → long
  s = s.replace(/([bcdfglmnprst])\1/g, '$1ː')
  return `/${s}/`
}

/**
 * Rule-based IPA transliteration — fi/de/fr/es/it.
 * Returns empty string for English (too irregular for reliable rules) and
 * unsupported languages — those fall back to the Dictionary API only.
 */
function ruleBasedIpa(word: string, language: string): string {
  const clean = word.trim()
  if (!clean) return ''
  switch (language) {
    case 'fi': return finnishPhonemic(clean)
    case 'de': return germanPhonemic(clean)
    case 'fr': return frenchPhonemic(clean)
    case 'es': return spanishPhonemic(clean)
    case 'it': return italianPhonemic(clean)
    default: return ''
  }
}

/**
 * Get IPA phonetic for a word: cache → Dictionary API → rule-based fallback.
 * Guaranteed to return a phonetic string for fi/de/fr/es/it even for
 * user-invented terms the dictionary has never seen.
 * Results are cached in localStorage (mm_ipa_v2) so repeated calls are instant.
 * Exported so AddWordDialog and CardTable can call it directly.
 */
export async function getIpaPhonetic(word: string, language: string): Promise<string> {
  if (!word.trim()) return ''
  // 1. localStorage cache (shared namespace with enrichWithPhonetics)
  const cached = getIpaCached(language, word)
  if (cached !== null) return cached // '' means a genuine miss was already recorded
  // 2. Dictionary API
  const apiResult = await fetchIpaPhonetic(word, language)
  if (apiResult) {
    setIpaCached(language, word, apiResult)
    return apiResult
  }
  // 3. Rule-based fallback
  const ruleResult = ruleBasedIpa(word, language)
  setIpaCached(language, word, ruleResult)
  return ruleResult
}

async function enrichWithPhonetics(words: GlossaryWord[], language: string): Promise<GlossaryWord[]> {
  const needsIpa = words.filter(w => !w.phonetic_spelling?.trim())
  if (needsIpa.length === 0) return words

  const resolved = new Map<string, string>() // word.id → IPA
  const toFetch: GlossaryWord[] = []

  for (const w of needsIpa) {
    const cached = getIpaCached(language, w.word)
    if (cached !== null) {
      // cached === '' means both API and rule-based returned nothing — skip
      if (cached) resolved.set(w.id, cached)
    } else if (language === 'fi') {
      // Finnish: always rule-based, no API call needed
      const ipa = finnishPhonemic(w.word)
      resolved.set(w.id, ipa)
      setIpaCached(language, w.word, ipa)
    } else {
      toFetch.push(w)
    }
  }

  // Batch API + rule-based fallback for remaining words
  const BATCH = 20
  for (let i = 0; i < toFetch.length; i += BATCH) {
    const batch = toFetch.slice(i, i + BATCH)
    // Only attempt API for languages the API supports
    const apiResults: PromiseSettledResult<string>[] = IPA_API_LANGS.has(language)
      ? await Promise.allSettled(batch.map(w => fetchIpaPhonetic(w.word, language)))
      : []

    batch.forEach((w, j) => {
      const apiResult = apiResults[j]
      let ipa = apiResult?.status === 'fulfilled' ? apiResult.value : ''
      if (!ipa) {
        // Rule-based fallback: covers de/fr/es/it and any API miss
        ipa = ruleBasedIpa(w.word, language)
      }
      // Cache whatever we ended up with (IPA_MISS stored when ipa === '')
      setIpaCached(language, w.word, ipa)
      if (ipa) resolved.set(w.id, ipa)
    })
  }

  return words.map(w => {
    if (w.phonetic_spelling?.trim()) return w
    const ipa = resolved.get(w.id)
    if (!ipa) return w
    return { ...w, phonetic_spelling: ipa }
  })
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

export async function getAllWords(language: string = 'en'): Promise<GlossaryWord[]> {
  try {
    if (!db) {
      console.warn('Firestore is not initialized, using default words');
      return createDefaultGlossaryWords();
    }

    const operation = async () => {
      const glossaryRef = collection(db as Firestore, 'glossary');
      const q = firestoreQuery(glossaryRef, orderBy('word'));
      const querySnapshot = await getDocs(q);
      let words = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GlossaryWord[];

      if (words.length === 0) {
        console.warn('No words found in glossary, using default words');
        return createDefaultGlossaryWords();
      }

      // Language filter: system words must match requested language; user words always included.
      // Falls back to EN system words when no language-specific words exist.
      const userWords = words.filter(w => w.source === 'user')
      const enSystemWords = words.filter(w => w.source === 'system' && (!w.language || w.language === 'en'))
      if (language === 'en') {
        words = [...enSystemWords, ...userWords]
      } else {
        const langSystemWords = words.filter(w => w.source === 'system' && w.language === language)
        words = langSystemWords.length > 0
          ? [...langSystemWords, ...userWords]
          : [...enSystemWords, ...userWords]
      }

      return assignDefaultClockIds(words);
    };

    const raw = await retryOperation(operation);
    const base = assignDefaultClockIds(await decryptPersonalWordsInList(raw));
    return enrichWithPhonetics(base, language);
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
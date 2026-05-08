/**
 * seed-sovereign-definitions.mjs
 *
 * Seeds the `academic` field in `glossary_definitions` from the Phase III
 * sovereign batch files (Positive P01–P17, Negative N01–N09, Neutral Neu01–Neu04).
 *
 * Uses merge writes — existing `standard` fields are preserved.
 * For words not yet in `glossary`, creates a new entry then writes the definition.
 *
 * Run:
 *   node scripts/seed-sovereign-definitions.mjs
 *
 * Requires: utils/data-mindmechanism-firebase-adminsdk-fbsvc-3558525fda.json
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = dirname(__dirname)

initializeApp({
  credential: cert(
    join(ROOT, 'utils', 'data-mindmechanism-firebase-adminsdk-fbsvc-3558525fda.json')
  ),
})

const db = getFirestore()

// ─── BATCH FILE PATHS ────────────────────────────────────────────────────────

const PHASE_III = join(
  '/Users/seanfortune/Documents/HQ/clinical_synthesis/Phase_III'
)

const BATCH_DIRS = [
  join(PHASE_III, 'Positive_Batches'),
  join(PHASE_III, 'Negative_Batches'),
  join(PHASE_III, 'Neutral_Batches'),
]

// ─── PARSER ──────────────────────────────────────────────────────────────────

/**
 * Parse a batch markdown file and return an array of node definitions.
 * Each entry: { word: string, academic: string }
 *
 * Node structure in file:
 *   ## WORD_NAME (Wheel | Grade N) [optional tag]
 *   **Clinical Definition**
 *   [text]
 *   **Proprietary Framework Reference**
 *   [text]
 *   **Clinical Pathway**
 *   [text]
 *   **Practitioner Application**
 *   [text]
 */
function parseBatchFile(filePath) {
  const content = readFileSync(filePath, 'utf8')
  const nodes = []

  // Split on ## headings that represent individual nodes (not the file title #)
  // A node heading looks like: ## WORD (Wheel | Grade N)
  const sections = content.split(/\n(?=## [A-Z])/)

  for (const section of sections) {
    const lines = section.trim().split('\n')
    const heading = lines[0]

    // Must start with ## and contain a word name
    if (!heading.startsWith('## ')) continue

    // Extract word name — everything up to the first ( or end of line
    const wordMatch = heading.match(/^## ([^(|\n]+)/)
    if (!wordMatch) continue

    const rawWord = wordMatch[1].trim()
    // Some words have parenthetical alternates in the heading like "RAMPANT (Rampancy)"
    // Keep only the primary name before any parenthetical
    const word = rawWord.split('(')[0].trim()

    // Skip section headings that aren't actual nodes (e.g. "GRADE-4 TECHNICAL NOTES")
    if (word.includes('GRADE') || word.includes('TECHNICAL') || word.includes('END BATCH')) continue

    // Extract the four sections
    const clinicalDef = extractSection(section, 'Clinical Definition')
    const frameworkRef = extractSection(section, 'Proprietary Framework Reference')
    const clinicalPath = extractSection(section, 'Clinical Pathway')
    const practitioner = extractSection(section, 'Practitioner Application')

    if (!clinicalDef) continue // Skip if no clinical definition found

    const academic = [
      '**Clinical Definition**',
      clinicalDef,
      '',
      '**Proprietary Framework Reference**',
      frameworkRef || '',
      '',
      '**Clinical Pathway**',
      clinicalPath || '',
      '',
      '**Practitioner Application**',
      practitioner || '',
    ].join('\n').trim()

    // Convert heading case to title case for matching
    nodes.push({ word: toTitleCase(word), academic })
  }

  return nodes
}

function extractSection(text, sectionName) {
  // Match **Section Name** followed by text until the next **bold heading** or ---
  const pattern = new RegExp(
    `\\*\\*${escapeRegex(sectionName)}\\*\\*\\s*\\n([\\s\\S]*?)(?=\\n\\*\\*[A-Z]|\\n---|$)`,
    'i'
  )
  const match = text.match(pattern)
  return match ? match[1].trim() : null
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function toTitleCase(str) {
  // Handle all-caps words, preserving hyphenated and multi-word names
  return str
    .toLowerCase()
    .replace(/(?:^|\s|-)\S/g, (c) => c.toUpperCase())
    .replace(/\bOf\b/g, 'of')
    .replace(/\bThe\b/g, 'the')
    .replace(/\bA\b/g, 'a')
    .replace(/\bAnd\b/g, 'and')
    // Restore capitalisation for first word
    .replace(/^\w/, (c) => c.toUpperCase())
}

// ─── COLLECT ALL NODES ───────────────────────────────────────────────────────

function loadAllNodes() {
  const allNodes = []
  const seen = new Map() // word (lowercase) → first-seen file

  for (const dir of BATCH_DIRS) {
    let files
    try {
      files = readdirSync(dir).filter((f) => f.endsWith('.md')).sort()
    } catch {
      console.warn(`⚠️  Directory not found: ${dir}`)
      continue
    }

    for (const file of files) {
      const filePath = join(dir, file)
      const nodes = parseBatchFile(filePath)
      for (const node of nodes) {
        const key = node.word.toLowerCase()
        if (seen.has(key)) {
          // Keep first occurrence (alphabetically first batch wins)
          continue
        }
        seen.set(key, file)
        allNodes.push(node)
      }
    }
  }

  return allNodes
}

// ─── MIGRATION ───────────────────────────────────────────────────────────────

async function seedSovereign() {
  console.log('\n👑  Mind Mechanism — Sovereign Definitions Seed')
  console.log('═══════════════════════════════════════════════\n')

  // 1. Parse all batch files
  const nodes = loadAllNodes()
  console.log(`📖  Parsed ${nodes.length} sovereign nodes from Phase III batch files.\n`)

  if (nodes.length === 0) {
    console.error('❌  No nodes parsed. Check batch file paths.')
    process.exit(1)
  }

  // 2. Load existing Firestore glossary words
  const glossarySnap = await db.collection('glossary').get()
  const firestoreWords = new Map() // lowercase → { id, word, ... }
  glossarySnap.forEach((doc) => {
    const data = doc.data()
    if (data.word) firestoreWords.set(data.word.toLowerCase().trim(), { id: doc.id, ...data })
  })
  console.log(`ℹ️   ${firestoreWords.size} existing glossary entries in Firestore.`)

  // 3. Load existing glossary_definitions to avoid overwriting sovereign content
  const defSnap = await db.collection('glossary_definitions').get()
  const existingDefs = new Map() // doc id → { standard, academic }
  defSnap.forEach((doc) => existingDefs.set(doc.id, doc.data()))
  console.log(`ℹ️   ${existingDefs.size} existing definition entries.\n`)

  const toWriteDefs = []   // { id, academic } — existing words
  const toCreate = []      // { word, academic } — new words
  const alreadyHas = []    // words that already have academic content
  const unmatched = []     // nodes from files with no Firestore match (will create)

  for (const node of nodes) {
    const key = node.word.toLowerCase()
    const match = firestoreWords.get(key)

    if (match) {
      const existing = existingDefs.get(match.id)
      if (existing?.academic) {
        alreadyHas.push(node.word)
      } else {
        toWriteDefs.push({ id: match.id, word: node.word, academic: node.academic })
      }
    } else {
      toCreate.push(node)
    }
  }

  console.log(`✅  ${toWriteDefs.length} sovereign definitions to write for existing words.`)
  console.log(`🆕  ${toCreate.length} new words to create with sovereign definitions.`)
  if (alreadyHas.length > 0) {
    console.log(`⏭️   ${alreadyHas.length} already have sovereign content (skipping).`)
  }

  // Words in Firestore with no sovereign source
  const parsedWords = new Set(nodes.map((n) => n.word.toLowerCase()))
  const noSovereign = []
  firestoreWords.forEach((entry, key) => {
    if (!parsedWords.has(key)) noSovereign.push(entry.word)
  })
  if (noSovereign.length > 0) {
    console.log(`\n⚠️   ${noSovereign.length} Firestore words have no sovereign source (not touched).`)
  }

  if (toWriteDefs.length === 0 && toCreate.length === 0) {
    console.log('\n✨  Nothing to do — all sovereign definitions already seeded.\n')
    return
  }

  const BATCH_SIZE = 400

  // 4. Write sovereign defs for existing words
  if (toWriteDefs.length > 0) {
    console.log('\n📝  Writing sovereign definitions for existing words…')
    let batch = db.batch()
    let count = 0
    for (const item of toWriteDefs) {
      const ref = db.collection('glossary_definitions').doc(item.id)
      batch.set(ref, { word_id: item.id, academic: item.academic }, { merge: true })
      count++
      if (count % BATCH_SIZE === 0) {
        await batch.commit()
        console.log(`    Committed ${count}…`)
        batch = db.batch()
      }
    }
    if (count % BATCH_SIZE !== 0) await batch.commit()
    console.log(`    ✅  ${toWriteDefs.length} sovereign definitions written.`)
  }

  // 5. Create new glossary words + sovereign definitions
  if (toCreate.length > 0) {
    console.log(`\n🌱  Creating ${toCreate.length} new glossary entries with sovereign definitions…`)
    let batch = db.batch()
    let count = 0
    for (const entry of toCreate) {
      // Determine rating from which batch type (heuristic from directory name)
      // We'll default to '~' neutral — admin can adjust individual words later
      const wordRef = db.collection('glossary').doc()
      const shortDef = entry.academic.split('\n')[1]?.trim() || entry.word
      batch.set(wordRef, {
        id: wordRef.id,
        word: entry.word,
        definition: shortDef.slice(0, 200),
        grade: 1,
        phonetic_spelling: '',
        rating: '~',
        source: 'system',
        version: 'Default',
        language: 'en',
        created_at: new Date().toISOString(),
      })
      const defRef = db.collection('glossary_definitions').doc(wordRef.id)
      batch.set(defRef, { word_id: wordRef.id, academic: entry.academic })
      count++
      // Each word uses 2 operations — stay well under 500 limit
      if (count % 200 === 0) {
        await batch.commit()
        console.log(`    Committed ${count}…`)
        batch = db.batch()
      }
    }
    if (count > 0) await batch.commit()
    console.log(`    ✅  ${toCreate.length} new words created.`)
  }

  console.log('\n═══════════════════════════════════════════════')
  console.log('👑  Sovereign seed complete.\n')
}

seedSovereign().catch((err) => {
  console.error('\n❌  Seed failed:', err.message)
  process.exit(1)
})

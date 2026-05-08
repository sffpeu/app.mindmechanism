import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { parse } from 'csv-parse';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin
initializeApp({
  credential: cert(join(dirname(__dirname), 'utils/data-mindmechanism-firebase-adminsdk-fbsvc-3558525fda.json'))
});

const db = getFirestore();

interface GlossaryWord {
  id: string;
  word: string;
  definition: string;
  grade: number;
  phonetic_spelling: string;
  rating: '+' | '-' | '~';
  source: 'system' | 'user';
  version: 'Default' | string;
  user_id?: string;
  created_at: string;
}

async function importGlossary() {
  const csvFilePath = join(dirname(__dirname), 'glossary_rows.csv');
  const fileContent = readFileSync(csvFilePath, { encoding: 'utf-8' });

  const parser = parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });

  let count = 0;
  const batchSize = 500; // Firestore batch limit is 500
  let currentBatch = db.batch();

  for await (const row of parser) {
    const docRef = db.collection('glossary').doc();
    const word: GlossaryWord = {
      id: docRef.id,
      word: row.word,
      definition: row.definition,
      grade: parseInt(row.grade, 10),
      phonetic_spelling: row.phonetic_spelling || '',
      rating: (row.rating || '~') as '+' | '-' | '~',
      source: 'system',
      version: 'Default',
      created_at: new Date().toISOString()
    };

    currentBatch.set(docRef, word);
    count++;

    if (count % batchSize === 0) {
      console.log(`Committing batch of ${batchSize} documents...`);
      await currentBatch.commit();
      currentBatch = db.batch();
    }
  }

  // Commit any remaining documents
  if (count % batchSize !== 0) {
    console.log(`Committing final batch of ${count % batchSize} documents...`);
    await currentBatch.commit();
  }

  console.log(`Successfully imported ${count} words to Firestore`);
}

// Run the import
importGlossary().catch(console.error); 
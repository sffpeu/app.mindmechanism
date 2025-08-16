import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { parse } from 'csv-parse';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin
initializeApp({
  credential: applicationDefault()
});

const db = getFirestore();

async function importGlossary() {
  const csvFilePath = join(dirname(__dirname), 'public', 'glossary_rows.csv');
  console.log('Reading CSV file from:', csvFilePath);
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
    const word = {
      id: docRef.id,
      word: row.word,
      definition: row.definition,
      grade: parseInt(row.grade, 10),
      phonetic_spelling: row.phonetic_spelling || '',
      rating: row.rating || '~',
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
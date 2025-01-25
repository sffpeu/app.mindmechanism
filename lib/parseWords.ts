import fs from 'fs';
import path from 'path';
import { Word } from './words';

export function parseCSV(): Word[] {
  const csvPath = path.join(process.cwd(), 'public', '1M3.Glossary.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');
  
  // Skip header lines
  const dataLines = lines.slice(2);
  
  return dataLines
    .filter(line => line.trim() !== '')
    .map(line => {
      const [word, definition, grade, phonetic, rating, source, version] = line.split(';');
      
      let type: 'Positive' | 'Neutral' | 'Negative';
      if (rating === '+') {
        type = 'Positive';
      } else if (rating === '~') {
        type = 'Neutral';
      } else {
        type = 'Negative';
      }
      
      return {
        word,
        definition,
        phonetic,
        rating: parseInt(grade),
        type
      };
    });
} 
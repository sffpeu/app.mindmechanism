import { Word } from './words';

export function parseCSV(csvContent: string): Word[] {
  const lines = csvContent.split('\n');
  
  // Skip header lines
  const dataLines = lines.slice(2);
  
  return dataLines
    .filter(line => line.trim() !== '')
    .map(line => {
      const [word, definition, grade, phonetic, rating, source, version = 'Default'] = line.split(';');
      
      return {
        word: word.trim(),
        definition: definition.trim(),
        phonetic: phonetic.trim(),
        rating: parseInt(rating.trim(), 10),
        type: determineType(parseInt(rating.trim(), 10)),
        version: version.trim() || 'Default'
      };
    });
}

function determineType(rating: number): 'Positive' | 'Neutral' | 'Negative' {
  if (rating >= 4) return 'Positive';
  if (rating <= 2) return 'Negative';
  return 'Neutral';
} 
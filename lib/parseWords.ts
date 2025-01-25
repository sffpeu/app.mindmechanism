import { Word } from './words';

export async function parseCSV(): Promise<Word[]> {
  const response = await fetch('/1M3.Glossary.csv');
  const csvContent = await response.text();
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
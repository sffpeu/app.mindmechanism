import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

function determineRating(type: string): number {
  const normalizedType = type.toLowerCase();
  if (normalizedType.includes('positive')) return 5;
  if (normalizedType.includes('neutral')) return 3;
  if (normalizedType.includes('negative')) return 1;
  return 3; // Default to neutral
}

function determineType(type: string): 'Positive' | 'Neutral' | 'Negative' {
  const normalizedType = type.toLowerCase();
  if (normalizedType.includes('positive')) return 'Positive';
  if (normalizedType.includes('negative')) return 'Negative';
  return 'Neutral';
}

export async function GET() {
  try {
    const csvPath = path.join(process.cwd(), 'data', 'words.csv');
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

    const words = records.map((record: any) => ({
      word: record.word || '',
      phonetic: record.phonetic || '',
      definition: record.definition || '',
      rating: determineRating(record.type),
      type: determineType(record.type)
    }));

    return NextResponse.json(words);
  } catch (error) {
    console.error('Error loading words:', error);
    return NextResponse.json([], { status: 500 });
  }
} 
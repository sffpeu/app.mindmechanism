import { NextResponse } from 'next/server';
import { getAllWords } from '@/lib/glossary';

export async function GET() {
  try {
    const words = await getAllWords();
    return NextResponse.json({ count: words.length, words });
  } catch (error) {
    console.error('Error testing glossary:', error);
    return NextResponse.json({ error: 'Failed to fetch words' }, { status: 500 });
  }
} 
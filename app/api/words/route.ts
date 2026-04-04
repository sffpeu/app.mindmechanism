import { NextResponse } from 'next/server'
import { getAllWords, searchWords } from '@/lib/glossary'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get('search')

    if (searchQuery) {
      const matchingWords = await searchWords(searchQuery)
      return NextResponse.json({
        success: true,
        count: matchingWords.length,
        words: matchingWords
      })
    }

    const words = await getAllWords()
    return NextResponse.json({
      success: true,
      count: words.length,
      words
    })
  } catch (error) {
    console.error('Error in words API:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch words' },
      { status: 500 }
    )
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import { getAllWords, searchWords } from '@/lib/glossary'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchQuery = request.nextUrl.searchParams.get('search')

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
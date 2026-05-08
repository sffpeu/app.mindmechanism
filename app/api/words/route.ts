import { NextResponse } from 'next/server'
import type { GlossaryWord } from '@/types/Glossary'
import { getAllWords, searchWords } from '@/lib/glossary'

export const dynamic = 'force-dynamic'

function redactPersonalNarrative(words: GlossaryWord[]): GlossaryWord[] {
  return words.map((word) => ({
    ...word,
    own_definition: undefined,
    context: undefined,
  }))
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get('search')
    const includeNarrative = searchParams.get('includeNarrative') === '1'

    if (searchQuery) {
      const matchingWords = await searchWords(searchQuery)
      const safeWords = includeNarrative ? matchingWords : redactPersonalNarrative(matchingWords)
      return NextResponse.json({
        success: true,
        count: safeWords.length,
        words: safeWords
      })
    }

    const words = await getAllWords()
    const safeWords = includeNarrative ? words : redactPersonalNarrative(words)
    return NextResponse.json({
      success: true,
      count: safeWords.length,
      words: safeWords
    })
  } catch (error) {
    console.error('Error in words API:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch words' },
      { status: 500 }
    )
  }
} 
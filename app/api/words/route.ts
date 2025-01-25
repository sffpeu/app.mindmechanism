import { NextResponse } from 'next/server'
import { getAllWords } from '@/lib/glossary'

export async function GET() {
  try {
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
import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebaseAdmin'

// Vercel cron: runs daily at 08:00 UTC.
// Set CRON_SECRET in Vercel env to protect this endpoint.
// Configure in vercel.json: { "crons": [{ "path": "/api/blog-sync", "schedule": "0 8 * * *" }] }
//
// TOLP blog source:
// Set TOLP_RSS_URL in Vercel env to point at the TOLP CMS feed.
// The MM tag filter: posts must include tag "mind-mechanism" (or equivalent) to be included.

const MM_TAG = (process.env.TOLP_MM_TAG ?? 'mind-mechanism').toLowerCase()

interface RssItem {
  title: string
  link: string
  pubDate: string
  description: string
  categories: string[]
}

async function fetchRssItems(feedUrl: string): Promise<RssItem[]> {
  const res = await fetch(feedUrl, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`)
  const xml = await res.text()

  // Minimal XML parsing — no external dep
  const items: RssItem[] = []
  const itemBlocks = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? []

  for (const block of itemBlocks) {
    const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ??
      block.match(/<title>(.*?)<\/title>/))?.[1]?.trim() ?? ''
    const link = (block.match(/<link>(.*?)<\/link>/))?.[1]?.trim() ?? ''
    const pubDate = (block.match(/<pubDate>(.*?)<\/pubDate>/))?.[1]?.trim() ?? ''
    const description = (block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ??
      block.match(/<description>(.*?)<\/description>/))?.[1]?.trim() ?? ''
    const categoryMatches = block.match(/<category(?:[^>]*)>([^<]*)<\/category>/g) ?? []
    const categories = categoryMatches.map(
      (c) => c.replace(/<[^>]+>/g, '').trim().toLowerCase()
    )

    items.push({ title, link, pubDate, description, categories })
  }

  return items
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim()
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const feedUrl = process.env.TOLP_RSS_URL
  if (!feedUrl) {
    return NextResponse.json({ error: 'TOLP_RSS_URL not configured' }, { status: 500 })
  }

  try {
    const items = await fetchRssItems(feedUrl)
    const mmItems = items.filter(
      (item) =>
        item.categories.includes(MM_TAG) ||
        item.title.toLowerCase().includes('mind mechanism') ||
        item.title.toLowerCase().includes('mm')
    )

    if (mmItems.length === 0) {
      return NextResponse.json({ synced: 0, message: 'No MM-tagged posts found' })
    }

    const adminDb = getAdminFirestore()
    const batch = adminDb.batch()

    for (const item of mmItems) {
      const id = Buffer.from(item.link).toString('base64url').slice(0, 40)
      const ref = adminDb.collection('blog_crosslinks').doc(id)
      batch.set(
        ref,
        {
          title: item.title,
          url: item.link,
          excerpt: stripHtml(item.description).slice(0, 280),
          published_at: item.pubDate
            ? new Date(item.pubDate).toISOString()
            : new Date().toISOString(),
          tags: item.categories,
          synced_at: new Date().toISOString(),
        },
        { merge: true }
      )
    }

    await batch.commit()
    return NextResponse.json({ synced: mmItems.length })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

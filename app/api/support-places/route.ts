import { NextRequest, NextResponse } from 'next/server'

// Proxies Google Places Nearby Search so the API key stays server-side.
// Set GOOGLE_PLACES_API_KEY in Vercel env.

const RADIUS_M = 5000

// Typed queries: { type, keyword, category } — category is used client-side for icon selection.
const QUERIES: Array<{ type: string; keyword?: string; category: string }> = [
  { type: 'hospital',  category: 'hospital' },
  { type: 'police',    category: 'emergency' },
  { type: 'doctor',    category: 'medical' },
  { type: 'pharmacy',  category: 'pharmacy' },
  { type: 'doctor',    keyword: 'therapist',    category: 'therapy' },
  { type: 'doctor',    keyword: 'counselling',  category: 'therapy' },
  { type: 'doctor',    keyword: 'psychologist', category: 'therapy' },
  { type: 'doctor',    keyword: 'psychiatrist', category: 'therapy' },
  { type: 'lodging',   keyword: 'refuge',       category: 'refuge' },
  { type: 'lodging',   keyword: 'shelter',      category: 'refuge' },
]

export interface PlaceResult {
  name: string
  vicinity: string
  lat: number
  lng: number
  types: string[]
  category: string
  open_now?: boolean
  rating?: number
  user_ratings_total?: number
  maps_url: string
}

async function searchPlaces(
  lat: number,
  lng: number,
  query: (typeof QUERIES)[number],
  apiKey: string
): Promise<PlaceResult[]> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json')
  url.searchParams.set('location', `${lat},${lng}`)
  url.searchParams.set('radius', String(RADIUS_M))
  url.searchParams.set('type', query.type)
  if (query.keyword) url.searchParams.set('keyword', query.keyword)
  url.searchParams.set('key', apiKey)

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
  if (!res.ok) return []

  const data = await res.json() as {
    results?: Array<{
      name?: string
      vicinity?: string
      place_id?: string
      geometry?: { location?: { lat?: number; lng?: number } }
      types?: string[]
      opening_hours?: { open_now?: boolean }
      rating?: number
      user_ratings_total?: number
    }>
  }

  return (data.results ?? []).slice(0, 4).map((p) => {
    const pLat = p.geometry?.location?.lat ?? lat
    const pLng = p.geometry?.location?.lng ?? lng
    return {
      name: p.name ?? 'Unknown',
      vicinity: p.vicinity ?? '',
      lat: pLat,
      lng: pLng,
      types: p.types ?? [],
      category: query.category,
      open_now: p.opening_hours?.open_now,
      rating: p.rating,
      user_ratings_total: p.user_ratings_total,
      maps_url: p.place_id
        ? `https://www.google.com/maps/place/?q=place_id:${p.place_id}`
        : `https://www.google.com/maps/search/?api=1&query=${pLat},${pLng}`,
    }
  })
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY not configured' }, { status: 503 })
  }

  const { searchParams } = req.nextUrl
  const lat = parseFloat(searchParams.get('lat') ?? '')
  const lng = parseFloat(searchParams.get('lng') ?? '')

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 })
  }

  const results = await Promise.allSettled(
    QUERIES.map((q) => searchPlaces(lat, lng, q, apiKey))
  )

  const places: PlaceResult[] = []
  const seen = new Set<string>()

  for (const r of results) {
    if (r.status !== 'fulfilled') continue
    for (const p of r.value) {
      const key = `${p.name}:${p.vicinity}`
      if (!seen.has(key)) {
        seen.add(key)
        places.push(p)
      }
    }
  }

  // Sort: therapy and refuge first, then by rating descending
  const categoryOrder: Record<string, number> = {
    emergency: 0, hospital: 1, therapy: 2, refuge: 3, medical: 4, pharmacy: 5,
  }
  places.sort((a, b) => {
    const co = (categoryOrder[a.category] ?? 9) - (categoryOrder[b.category] ?? 9)
    if (co !== 0) return co
    return (b.rating ?? 0) - (a.rating ?? 0)
  })

  return NextResponse.json({ places })
}

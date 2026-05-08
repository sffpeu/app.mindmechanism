'use client'

import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Building2,
  ExternalLink,
  HeartPulse,
  Home,
  MapPin,
  Phone,
  Pill,
  Shield,
  Star,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useLocation } from '@/lib/hooks/useLocation'
import { cn } from '@/lib/utils'
import type { PlaceResult } from '@/app/api/support-places/route'

// ─── Static crisis lines ──────────────────────────────────────────────────────

interface CrisisLine {
  label: string
  number?: string
  region: string
  url?: string
}

const CRISIS_LINES: CrisisLine[] = [
  { label: 'Emergency services',  number: '112',                region: 'EU / International' },
  { label: 'Emergency services',  number: '911',                region: 'US / Canada' },
  { label: 'Emergency services',  number: '999',                region: 'UK' },
  { label: 'Mental health crisis',number: '988',                region: 'US', url: 'https://988lifeline.org' },
  { label: 'Samaritans',          number: '116 123',            region: 'UK / Ireland', url: 'https://www.samaritans.org' },
  { label: 'Crisis Text Line',    number: 'Text HOME to 741741', region: 'US', url: 'https://www.crisistextline.org' },
  { label: 'Telefonseelsorge',    number: '0800 111 0 111',     region: 'Germany', url: 'https://www.telefonseelsorge.de' },
  { label: 'Beyond Blue',         number: '1300 22 4636',       region: 'Australia', url: 'https://www.beyondblue.org.au' },
  { label: 'IASP — global directory', region: 'Worldwide',     url: 'https://www.iasp.info/resources/Crisis_Centres/' },
]

// ─── Icon + label per category ────────────────────────────────────────────────

const CATEGORY_META: Record<string, { Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>, color: string, label: string }> = {
  emergency: { Icon: Shield,     color: '#3182ce', label: 'Emergency services' },
  hospital:  { Icon: Building2,  color: '#e53e3e', label: 'Hospital / A&E' },
  therapy:   { Icon: HeartPulse, color: '#805ad5', label: 'Therapy / mental health' },
  refuge:    { Icon: Home,       color: '#d69e2e', label: 'Refuge / shelter' },
  medical:   { Icon: HeartPulse, color: '#38a169', label: 'Medical' },
  pharmacy:  { Icon: Pill,       color: '#319795', label: 'Pharmacy' },
}

function getMeta(category: string) {
  return CATEGORY_META[category] ?? { Icon: MapPin, color: '#718096', label: 'Local service' }
}

// ─── Google Maps search links for manual lookup ───────────────────────────────

const MAPS_SEARCHES = [
  { label: 'Therapists near me',       query: 'therapist+near+me' },
  { label: 'Psychiatrists near me',    query: 'psychiatrist+near+me' },
  { label: 'Crisis support near me',   query: 'mental+health+crisis+support+near+me' },
  { label: 'Domestic refuge near me',  query: 'domestic+violence+refuge+near+me' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function CrisisLineRow({ line }: { line: CrisisLine }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-black/5 dark:border-white/5 last:border-0">
      <Phone className="h-4 w-4 text-red-500 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{line.label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{line.region}</p>
      </div>
      <div className="text-right shrink-0 space-y-0.5">
        {line.number && (
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 font-mono whitespace-nowrap">
            {line.number}
          </p>
        )}
        {line.url && (
          <a
            href={line.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5"
          >
            Visit <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>
    </div>
  )
}

function StarRating({ rating, total }: { rating: number; total?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-500 dark:text-amber-400">
      <Star className="h-2.5 w-2.5 fill-current" />
      {rating.toFixed(1)}
      {total != null && (
        <span className="text-gray-400 dark:text-gray-500 ml-0.5">({total})</span>
      )}
    </span>
  )
}

function PlaceCard({ place }: { place: PlaceResult }) {
  const { Icon, color, label } = getMeta(place.category)

  return (
    <a
      href={place.maps_url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 p-3 rounded-lg border border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] hover:bg-white/90 dark:hover:bg-white/[0.07] transition-colors"
    >
      <div
        className="mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{place.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{place.vicinity}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-[10px] text-gray-400 dark:text-gray-500">{label}</p>
          {place.rating != null && (
            <StarRating rating={place.rating} total={place.user_ratings_total} />
          )}
        </div>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1">
        {place.open_now !== undefined && (
          <span
            className={cn(
              'text-[10px] font-medium px-1.5 py-0.5 rounded',
              place.open_now
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
            )}
          >
            {place.open_now ? 'Open' : 'Closed'}
          </span>
        )}
        <ExternalLink className="h-3 w-3 text-gray-400" />
      </div>
    </a>
  )
}

// ─── Main content ─────────────────────────────────────────────────────────────

function SupportContent() {
  const { location, isLoading: locationLoading, error: locationError } = useLocation()
  const [places, setPlaces] = useState<PlaceResult[]>([])
  const [placesLoading, setPlacesLoading] = useState(false)
  const [placesError, setPlacesError] = useState<string | null>(null)

  const coords = location?.coords

  useEffect(() => {
    if (!coords) return
    setPlacesLoading(true)
    setPlacesError(null)
    fetch(`/api/support-places?lat=${coords.lat}&lng=${coords.lon}`)
      .then((r) => r.json())
      .then((data: { places?: PlaceResult[]; error?: string }) => {
        if (data.error) setPlacesError(data.error)
        else setPlaces(data.places ?? [])
      })
      .catch(() => setPlacesError('Could not load nearby services.'))
      .finally(() => setPlacesLoading(false))
  }, [coords?.lat, coords?.lon])

  // Group places by category for display
  const therapyPlaces = places.filter((p) => p.category === 'therapy')
  const refugePlaces  = places.filter((p) => p.category === 'refuge')
  const tierOnePlaces = places.filter((p) => ['emergency', 'hospital', 'medical', 'pharmacy'].includes(p.category))

  return (
    <div className="space-y-8">

      {/* Immediate danger */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
        <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
          If you are in immediate danger call your local emergency number now.
          EU / international: <strong>112</strong> · UK: <strong>999</strong> · US: <strong>911</strong>
        </p>
      </div>

      {/* Crisis lines */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
          Crisis &amp; support lines
        </h2>
        <Card className="p-4 bg-white/80 dark:bg-white/[0.04] border border-black/5 dark:border-white/10">
          {CRISIS_LINES.map((l) => (
            <CrisisLineRow key={`${l.label}-${l.region}`} line={l} />
          ))}
        </Card>
      </section>

      {/* Location-based */}
      <section>
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="h-3.5 w-3.5 text-gray-400" />
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
            Near you
          </h2>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 leading-relaxed">
          Results are pulled from Google Places and are not independently verified by the Mind Mechanism.
          Ratings reflect public Google reviews. Always call ahead to confirm availability.
        </p>

        {locationLoading && (
          <p className="text-sm text-gray-400">Locating you…</p>
        )}
        {locationError && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Location unavailable — enable location access in Settings to see nearby services.
          </p>
        )}
        {!locationLoading && !locationError && placesLoading && (
          <p className="text-sm text-gray-400">Finding nearby services…</p>
        )}
        {placesError && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{placesError}</p>
        )}

        {therapyPlaces.length > 0 && (
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-2">
              Therapy &amp; mental health
            </p>
            <div className="space-y-2">
              {therapyPlaces.map((p) => <PlaceCard key={`${p.name}:${p.vicinity}`} place={p} />)}
            </div>
          </div>
        )}
        {refugePlaces.length > 0 && (
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2">
              Refuge &amp; shelter
            </p>
            <div className="space-y-2">
              {refugePlaces.map((p) => <PlaceCard key={`${p.name}:${p.vicinity}`} place={p} />)}
            </div>
          </div>
        )}
        {tierOnePlaces.length > 0 && (
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
              Emergency, medical &amp; pharmacy
            </p>
            <div className="space-y-2">
              {tierOnePlaces.map((p) => <PlaceCard key={`${p.name}:${p.vicinity}`} place={p} />)}
            </div>
          </div>
        )}

        {!locationLoading && !locationError && !placesLoading && places.length === 0 && !placesError && (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            No services found within 5 km. Try searching Google Maps directly below.
          </p>
        )}
      </section>

      {/* Manual Google Maps searches */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
          Search Google Maps
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {MAPS_SEARCHES.map((s) => (
            <a
              key={s.query}
              href={`https://www.google.com/maps/search/${s.query}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg border border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] hover:bg-white/90 dark:hover:bg-white/[0.07] transition-colors text-sm text-gray-700 dark:text-gray-300"
            >
              <ExternalLink className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              {s.label}
            </a>
          ))}
        </div>
      </section>

      {/* About & contact */}
      <section className="border-t border-black/5 dark:border-white/5 pt-6">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
          About this service
        </h2>
        <Card className="p-4 bg-white/80 dark:bg-white/[0.04] border border-black/5 dark:border-white/10 space-y-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          <p>
            Mind Mechanism is an independent wellbeing tool created by{' '}
            <strong className="text-gray-900 dark:text-white">Sean Fortune</strong> (The One-Legged Poet).
            It is a personal practice environment, not a clinical platform.
          </p>
          <p>
            This support directory exists to ensure that anyone who needs real-world help can find it quickly.
            It is not a substitute for professional care and does not provide crisis intervention.
          </p>
          <div className="pt-1 space-y-1 text-xs text-gray-500 dark:text-gray-400">
            <p>
              Contact:{' '}
              <a
                href="mailto:future@theoneleggedpoet.com"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                future@theoneleggedpoet.com
              </a>
            </p>
            <p>
              Web:{' '}
              <a
                href="https://www.theoneleggedpoet.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5"
              >
                theoneleggedpoet.com <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </p>
          </div>
        </Card>
      </section>

      {/* Legal disclaimer */}
      <p className="text-[11px] text-gray-400 dark:text-gray-600 leading-relaxed border-t border-black/5 dark:border-white/5 pt-6">
        Mind Mechanism is not a medical service and is not a substitute for professional care.
        Directory listings are sourced from public databases and have not been independently vetted.
        In a mental health crisis, please contact a qualified professional or call your local emergency services.
        Mind Mechanism accepts no liability for the accuracy, availability, or conduct of any third-party service listed here.
      </p>

    </div>
  )
}

export default function SupportPage() {
  return (
    <ProtectedRoute>
      <div className="h-full overflow-y-auto bg-transparent">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <header className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Support &amp; Emergency Services
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              You are not alone. Help is here.
            </p>
          </header>
          <SupportContent />
        </div>
      </div>
    </ProtectedRoute>
  )
}

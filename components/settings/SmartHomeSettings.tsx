'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import {
  Lightbulb,
  Wifi,
  WifiOff,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Link2Off,
  Home,
  RefreshCw,
} from 'lucide-react'
import { useSettings } from '@/lib/hooks/useSettings'
import { CLOCK_HEX } from '@/lib/hueColors'
import { clockTitles } from '@/lib/clockTitles'
import { cn } from '@/lib/utils'

type PairingStep = 'idle' | 'discovering' | 'discovered' | 'pairing' | 'connected' | 'error'

interface DiscoveredBridge {
  id: string
  internalipaddress: string
}

interface HueRoom {
  id: string
  name: string
  lightIds: string[]
}

export function SmartHomeSettings() {
  const {
    hueEnabled, setHueEnabled,
    hueBridgeIp, setHueBridgeIp,
    hueApiKey, setHueApiKey,
    hueBrightness, setHueBrightness,
    hueLightIds, setHueLightIds,
    hueRoomIds, setHueRoomIds,
    setSmartHomeHub,
  } = useSettings()

  const isConnected = !!(hueBridgeIp && hueApiKey)

  const [step, setStep] = useState<PairingStep>(isConnected ? 'connected' : 'idle')
  const [discovered, setDiscovered] = useState<DiscoveredBridge[]>([])
  const [selectedBridge, setSelectedBridge] = useState<string>(hueBridgeIp ?? '')
  const [errorMsg, setErrorMsg] = useState('')

  // Room data fetched from bridge after connection
  const [rooms, setRooms] = useState<HueRoom[]>([])
  const [roomsLoading, setRoomsLoading] = useState(false)
  const [roomsError, setRoomsError] = useState('')

  // ── Load rooms once connected ────────────────────────────────────────────

  const loadRooms = useCallback(async (ip: string, key: string) => {
    setRoomsLoading(true)
    setRoomsError('')
    try {
      const res = await fetch(
        `/api/hue/rooms?bridgeIp=${encodeURIComponent(ip)}&apiKey=${encodeURIComponent(key)}`
      )
      const data = (await res.json()) as { rooms?: HueRoom[]; error?: string }
      if (!res.ok || !data.rooms) {
        throw new Error(data.error ?? 'Could not load rooms')
      }
      setRooms(data.rooms)
    } catch (err) {
      setRoomsError(err instanceof Error ? err.message : 'Could not load rooms')
    } finally {
      setRoomsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isConnected && hueBridgeIp && hueApiKey && rooms.length === 0 && !roomsLoading) {
      void loadRooms(hueBridgeIp, hueApiKey)
    }
  }, [isConnected, hueBridgeIp, hueApiKey, rooms.length, roomsLoading, loadRooms])

  // ── Room selection ────────────────────────────────────────────────────────

  const toggleRoom = (room: HueRoom) => {
    const isSelected = hueRoomIds.includes(room.id)
    let nextRoomIds: string[]
    let nextLightIds: string[]

    if (isSelected) {
      // Deselect: remove room ID and its lights (unless another selected room uses the same light)
      nextRoomIds = hueRoomIds.filter((id) => id !== room.id)
      const remainingLights = new Set(
        rooms
          .filter((r) => nextRoomIds.includes(r.id))
          .flatMap((r) => r.lightIds)
      )
      nextLightIds = Array.from(remainingLights)
    } else {
      // Select: add room ID and merge its lights
      nextRoomIds = [...hueRoomIds, room.id]
      const mergedLights = new Set([...hueLightIds, ...room.lightIds])
      nextLightIds = Array.from(mergedLights)
    }

    setHueRoomIds(nextRoomIds)
    setHueLightIds(nextLightIds)
  }

  const selectAllRooms = () => {
    setHueRoomIds([])
    setHueLightIds([])
  }

  // ── Discovery ────────────────────────────────────────────────────────────

  const handleDiscover = async () => {
    setStep('discovering')
    setErrorMsg('')
    try {
      const res = await fetch('/api/hue/discover')
      const data = (await res.json()) as DiscoveredBridge[] | { error: string }
      if (!res.ok || 'error' in data) {
        throw new Error(('error' in data ? data.error : null) ?? 'Discovery failed')
      }
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No Hue bridge found on this network. Make sure it is powered on and connected.')
      }
      setDiscovered(data)
      setSelectedBridge(data[0].internalipaddress)
      setStep('discovered')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Discovery failed')
      setStep('error')
    }
  }

  // ── Pairing ──────────────────────────────────────────────────────────────

  const handlePair = async () => {
    setStep('pairing')
    setErrorMsg('')
    try {
      const res = await fetch('/api/hue/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bridgeIp: selectedBridge }),
      })
      const data = (await res.json()) as { username?: string; error?: string }
      if (!res.ok || !data.username) {
        throw new Error(data.error ?? 'Pairing failed')
      }
      setHueBridgeIp(selectedBridge)
      setHueApiKey(data.username)
      setSmartHomeHub('hue')
      setStep('connected')
      void loadRooms(selectedBridge, data.username)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Pairing failed')
      setStep('error')
    }
  }

  // ── Disconnect ────────────────────────────────────────────────────────────

  const handleDisconnect = () => {
    setHueBridgeIp(null)
    setHueApiKey(null)
    setHueLightIds([])
    setHueRoomIds([])
    setSmartHomeHub(null)
    setStep('idle')
    setDiscovered([])
    setSelectedBridge('')
    setErrorMsg('')
    setRooms([])
  }

  // ─────────────────────────────────────────────────────────────────────────

  const allRooms = hueRoomIds.length === 0

  return (
    <div className="space-y-4">

      {/* ── What this does ───────────────────────────────────────────── */}
      <Card className="p-4 bg-white/50 dark:bg-black/50 space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <p className="text-sm font-medium text-gray-900 dark:text-white">Responsive environment</p>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          When you open a wheel page the room lighting transitions to that node's colour.
          Each wheel maps to its frequency hue — grounding the physical space in the same
          colour grammar as the MM.
        </p>

        {/* Node colour preview */}
        <div className="grid grid-cols-3 gap-1.5">
          {CLOCK_HEX.map((hex, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] font-medium"
              style={{ backgroundColor: `${hex}22`, color: hex }}
            >
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: hex }} />
              {clockTitles[i]}
            </div>
          ))}
        </div>
      </Card>

      {/* ── Philips Hue ──────────────────────────────────────────────── */}
      <Card className="p-4 bg-white/50 dark:bg-black/50 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Wifi className={cn('h-4 w-4', isConnected ? 'text-green-500' : 'text-gray-400')} />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Philips Hue</p>
              {isConnected && hueBridgeIp && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                  {hueBridgeIp}
                </p>
              )}
            </div>
          </div>
          {isConnected && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium text-green-600 dark:text-green-400">Connected</span>
            </div>
          )}
        </div>

        {/* Connected state */}
        {isConnected && (
          <>
            {/* Sync toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">Sync colours</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Lights transition when you open a wheel page
                </p>
              </div>
              <Switch
                checked={hueEnabled}
                onCheckedChange={setHueEnabled}
                aria-label="Toggle Hue colour sync"
              />
            </div>

            {hueEnabled && (
              <>
                {/* Brightness */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-gray-600 dark:text-gray-400">Brightness</Label>
                    <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
                      {Math.round((hueBrightness / 254) * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[hueBrightness]}
                    onValueChange={([v]) => setHueBrightness(v)}
                    min={1}
                    max={254}
                    step={1}
                    aria-label="Hue brightness"
                  />
                </div>

                {/* Room picker */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-gray-600 dark:text-gray-400">
                      Rooms
                    </Label>
                    {rooms.length > 0 && (
                      <button
                        type="button"
                        onClick={() => void loadRooms(hueBridgeIp!, hueApiKey!)}
                        disabled={roomsLoading}
                        className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        aria-label="Refresh room list"
                      >
                        <RefreshCw className={cn('h-3 w-3', roomsLoading && 'animate-spin')} />
                        Refresh
                      </button>
                    )}
                  </div>

                  {roomsLoading && (
                    <div className="flex items-center gap-2 py-2 text-xs text-gray-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Loading rooms…
                    </div>
                  )}

                  {roomsError && (
                    <p className="text-xs text-red-500 dark:text-red-400">{roomsError}</p>
                  )}

                  {!roomsLoading && rooms.length > 0 && (
                    <div className="space-y-1.5">
                      {/* All rooms option */}
                      <button
                        type="button"
                        onClick={selectAllRooms}
                        className={cn(
                          'w-full flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm text-left transition-colors',
                          allRooms
                            ? 'border-violet-400 dark:border-violet-600 bg-violet-50/60 dark:bg-violet-950/20 text-violet-700 dark:text-violet-300'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/40'
                        )}
                      >
                        <div className={cn(
                          'h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                          allRooms
                            ? 'border-violet-500 bg-violet-500'
                            : 'border-gray-300 dark:border-gray-600'
                        )}>
                          {allRooms && (
                            <svg viewBox="0 0 10 8" className="h-2.5 w-2.5 fill-white" aria-hidden>
                              <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <Home className="h-3.5 w-3.5 shrink-0" />
                        <span className="font-medium">All rooms</span>
                        <span className="ml-auto text-[10px] text-gray-400 dark:text-gray-500">
                          {rooms.reduce((n, r) => n + r.lightIds.length, 0)} lights
                        </span>
                      </button>

                      {/* Individual rooms */}
                      {rooms.map((room) => {
                        const selected = hueRoomIds.includes(room.id)
                        return (
                          <button
                            key={room.id}
                            type="button"
                            onClick={() => toggleRoom(room)}
                            disabled={allRooms}
                            className={cn(
                              'w-full flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm text-left transition-colors',
                              allRooms && 'opacity-40 cursor-default',
                              !allRooms && selected
                                ? 'border-violet-400 dark:border-violet-600 bg-violet-50/60 dark:bg-violet-950/20 text-violet-700 dark:text-violet-300'
                                : !allRooms
                                  ? 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/40'
                                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                            )}
                          >
                            <div className={cn(
                              'h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                              selected && !allRooms
                                ? 'border-violet-500 bg-violet-500'
                                : 'border-gray-300 dark:border-gray-600'
                            )}>
                              {selected && !allRooms && (
                                <svg viewBox="0 0 10 8" className="h-2.5 w-2.5 fill-white" aria-hidden>
                                  <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                            <span>{room.name}</span>
                            <span className="ml-auto text-[10px] text-gray-400 dark:text-gray-500">
                              {room.lightIds.length} light{room.lightIds.length === 1 ? '' : 's'}
                            </span>
                          </button>
                        )
                      })}

                      <p className="text-[10px] text-gray-400 dark:text-gray-500 pt-0.5">
                        {allRooms
                          ? 'All lights on the bridge will respond'
                          : hueRoomIds.length === 0
                            ? 'Select rooms to restrict which lights respond'
                            : `${hueLightIds.length} light${hueLightIds.length === 1 ? '' : 's'} in ${hueRoomIds.length} room${hueRoomIds.length === 1 ? '' : 's'} will respond`}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            <button
              type="button"
              onClick={handleDisconnect}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors mt-1"
            >
              <Link2Off className="h-3.5 w-3.5" />
              Disconnect bridge
            </button>
          </>
        )}

        {/* Not connected — pairing flow */}
        {!isConnected && (
          <div className="space-y-3">
            {step === 'idle' && (
              <button
                type="button"
                onClick={handleDiscover}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 py-2.5 text-sm text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-900/30 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
              >
                <Search className="h-4 w-4" />
                Find bridge on this network
              </button>
            )}

            {step === 'discovering' && (
              <div className="flex items-center justify-center gap-2 py-3 text-sm text-gray-500 dark:text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching for bridges…
              </div>
            )}

            {step === 'discovered' && (
              <div className="space-y-3">
                {discovered.length > 1 ? (
                  <div className="space-y-1">
                    {discovered.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBridge(b.internalipaddress)}
                        className={cn(
                          'w-full flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors',
                          selectedBridge === b.internalipaddress
                            ? 'border-violet-400 bg-violet-50/50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-300'
                            : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/40'
                        )}
                      >
                        <span className="font-mono text-xs">{b.internalipaddress}</span>
                        <span className="text-[10px] text-gray-400">{b.id.slice(0, 8)}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-md bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 px-3 py-2">
                    <Wifi className="h-4 w-4 text-green-500 shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-mono">{discovered[0]?.internalipaddress}</span>
                    <span className="text-xs text-gray-400 ml-auto">Found</span>
                  </div>
                )}

                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-3">
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-300">Press the button on your Hue bridge</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Then click Connect within 30 seconds.</p>
                </div>

                <div className="flex gap-2">
                  <button type="button" onClick={() => setStep('idle')}
                    className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    Back
                  </button>
                  <button type="button" onClick={handlePair}
                    className="flex-1 rounded-lg border border-violet-400 dark:border-violet-600 py-2 text-sm font-medium text-violet-700 dark:text-violet-300 bg-violet-50/50 dark:bg-violet-950/20 hover:bg-violet-100/60 dark:hover:bg-violet-900/30 transition-colors">
                    Connect
                  </button>
                </div>
              </div>
            )}

            {step === 'pairing' && (
              <div className="flex items-center justify-center gap-2 py-3 text-sm text-gray-500 dark:text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting to bridge…
              </div>
            )}

            {step === 'error' && (
              <div className="space-y-3">
                <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 p-3">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 dark:text-red-400">{errorMsg}</p>
                </div>
                <button type="button" onClick={() => setStep('idle')}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  Try again
                </button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ── IKEA placeholder ─────────────────────────────────────────── */}
      <Card className="p-4 bg-white/50 dark:bg-black/50 opacity-60">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">IKEA Dirigera</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Integration coming — requires IKEA DIRIGERA hub on the same network
              </p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 whitespace-nowrap">
            Soon
          </span>
        </div>
      </Card>

    </div>
  )
}

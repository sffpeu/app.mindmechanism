'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Lightbulb,
  Loader2,
  Radio,
  RefreshCw,
  Unplug,
  Wand2,
} from 'lucide-react'
import { useSettings } from '@/lib/hooks/useSettings'
import { CLOCK_HEX, clockIndexToHueState } from '@/lib/hueColors'
import { clockTitles } from '@/lib/clockTitles'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type HueDiscoveryEntry = {
  id?: string
  internalipaddress?: string
}

type HueRoomRow = { id: string; name: string; lightIds: string[] }

export function SmartHomeSettings() {
  const {
    smartHomeHub,
    setSmartHomeHub,
    hueBridgeIp,
    setHueBridgeIp,
    hueApiKey,
    setHueApiKey,
    hueEnabled,
    setHueEnabled,
    hueBrightness,
    setHueBrightness,
    hueTransitionSec,
    setHueTransitionSec,
    hueLightIds,
    setHueLightIds,
    hueRoomIds,
    setHueRoomIds,
    hueUseAllLights,
    setHueUseAllLights,
  } = useSettings()

  const [bridgeInput, setBridgeInput] = useState(hueBridgeIp ?? '')
  const [discoverBusy, setDiscoverBusy] = useState(false)
  const [pairBusy, setPairBusy] = useState(false)
  const [roomsBusy, setRoomsBusy] = useState(false)
  const [roomsList, setRoomsList] = useState<HueRoomRow[]>([])
  const [discovered, setDiscovered] = useState<HueDiscoveryEntry[]>([])

  useEffect(() => {
    setBridgeInput(hueBridgeIp ?? '')
  }, [hueBridgeIp])

  const connected = Boolean(hueBridgeIp && hueApiKey && smartHomeHub === 'hue')

  const isProbablyLocalServer =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.endsWith('.local'))

  const fetchRooms = useCallback(async () => {
    if (!hueBridgeIp?.trim() || !hueApiKey?.trim()) return
    setRoomsBusy(true)
    try {
      const q = new URLSearchParams({
        bridgeIp: hueBridgeIp.trim(),
        apiKey: hueApiKey.trim(),
      })
      const res = await fetch(`/api/hue/rooms?${q}`)
      const data = (await res.json()) as {
        rooms?: HueRoomRow[]
        error?: string
      }
      if (!res.ok) {
        throw new Error(data.error || res.statusText)
      }
      const rooms = data.rooms ?? []
      setRoomsList(rooms)
      const rid = useSettings.getState().hueRoomIds
      if (!useSettings.getState().hueUseAllLights && rid.length > 0 && rooms.length > 0) {
        const ids = new Set<string>()
        for (const id of rid) {
          rooms.find((r) => r.id === id)?.lightIds.forEach((x) => ids.add(x))
        }
        useSettings.getState().setHueLightIds([...ids])
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load rooms')
      setRoomsList([])
    } finally {
      setRoomsBusy(false)
    }
  }, [hueBridgeIp, hueApiKey])

  useEffect(() => {
    if (connected) void fetchRooms()
  }, [connected, fetchRooms])

  const applyRoomSelection = useCallback(
    (roomIds: string[], roomRows: HueRoomRow[]) => {
      setHueRoomIds(roomIds)
      const ids = new Set<string>()
      for (const rid of roomIds) {
        const row = roomRows.find((r) => r.id === rid)
        row?.lightIds.forEach((id) => ids.add(id))
      }
      setHueLightIds([...ids])
    },
    [setHueLightIds, setHueRoomIds]
  )

  const handleDiscover = async () => {
    setDiscoverBusy(true)
    setDiscovered([])
    try {
      const res = await fetch('/api/hue/discover')
      const data = await res.json()
      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Discovery failed')
      }
      const list = Array.isArray(data) ? (data as HueDiscoveryEntry[]) : []
      setDiscovered(list)
      if (list.length === 1 && list[0]?.internalipaddress) {
        setBridgeInput(list[0].internalipaddress!)
        setHueBridgeIp(list[0].internalipaddress!)
        toast.success('Bridge found — IP filled in.')
      } else if (list.length > 1) {
        toast.message(`${list.length} bridges found — pick an IP or enter yours.`)
      } else {
        toast.message('No bridges reported by discovery. Enter your bridge IP manually.')
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Discovery failed')
    } finally {
      setDiscoverBusy(false)
    }
  }

  const handlePair = async () => {
    const ip = bridgeInput.trim()
    if (!ip) {
      toast.error('Enter your Hue bridge IP address first.')
      return
    }
    setHueBridgeIp(ip)
    setPairBusy(true)
    try {
      const res = await fetch('/api/hue/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bridgeIp: ip }),
      })
      const text = await res.text()
      let data: { error?: string; username?: string }
      try {
        data = JSON.parse(text) as { error?: string; username?: string }
      } catch {
        throw new Error(
          `Server returned non-JSON (try local dev on the same Wi‑Fi as the bridge). Start: ${text.slice(0, 80)}`
        )
      }
      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Pairing failed')
      }
      const username = data.username as string | undefined
      if (!username) {
        throw new Error('No username returned from bridge')
      }
      setHueApiKey(username)
      setSmartHomeHub('hue')
      setHueUseAllLights(true)
      setHueRoomIds([])
      setHueLightIds([])
      toast.success('Bridge paired. Choose rooms or use all lights.')
      void fetchRooms()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Pairing failed')
    } finally {
      setPairBusy(false)
    }
  }

  const handleDisconnect = () => {
    setHueApiKey(null)
    setHueBridgeIp(null)
    setSmartHomeHub(null)
    setHueRoomIds([])
    setHueLightIds([])
    setRoomsList([])
    setHueUseAllLights(true)
    setBridgeInput('')
    toast.message('Hue connection cleared.')
  }

  const toggleRoom = (roomId: string) => {
    setHueUseAllLights(false)
    const next = hueRoomIds.includes(roomId)
      ? hueRoomIds.filter((id) => id !== roomId)
      : [...hueRoomIds, roomId]
    applyRoomSelection(next, roomsList)
  }

  const handleAllLightsToggle = (all: boolean) => {
    setHueUseAllLights(all)
    if (all) {
      setHueRoomIds([])
      setHueLightIds([])
    }
  }

  const handleTestColour = async () => {
    if (!hueBridgeIp?.trim() || !hueApiKey?.trim()) return
    if (!hueUseAllLights && hueLightIds.length === 0) {
      toast.error('Select at least one room, or enable “All lights”.')
      return
    }
    try {
      const state = clockIndexToHueState(3, hueBrightness, hueTransitionSec)
      const res = await fetch('/api/hue/lights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bridgeIp: hueBridgeIp.trim(),
          apiKey: hueApiKey.trim(),
          state,
          lightIds: hueUseAllLights ? undefined : hueLightIds.length > 0 ? hueLightIds : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Request failed')
      }
      toast.success(
        typeof data.addressed === 'number'
          ? `Sent test colour to ${data.addressed} light(s).`
          : 'Test colour sent.'
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Test failed')
    }
  }

  const productionWarning = useMemo(
    () =>
      !isProbablyLocalServer ? (
        <p className="text-xs text-amber-800 dark:text-amber-200/90">
          <strong>Deployed builds</strong> usually cannot reach a bridge on your Wi‑Fi. Run{' '}
          <code className="rounded bg-amber-100 px-1 dark:bg-amber-950/80">next dev</code> on the
          same network as the bridge, or self‑host the app at home.
        </p>
      ) : null,
    [isProbablyLocalServer]
  )

  return (
    <div className="space-y-4">
      <Card className="space-y-2 border-amber-200/80 bg-amber-50/90 p-4 dark:border-amber-500/30 dark:bg-amber-950/40">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-amber-700 dark:text-amber-400" />
          <p className="text-sm font-medium text-amber-950 dark:text-amber-100">Local network</p>
        </div>
        <p className="text-xs leading-relaxed text-amber-950/85 dark:text-amber-100/85">
          Hue uses your <strong>bridge on the LAN</strong> (CLIP API). The Next.js server must run
          on the same network as the bridge so <code className="rounded bg-black/5 px-1 dark:bg-white/10">/api/hue/*</code>{' '}
          can reach it.
        </p>
        {productionWarning}
      </Card>

      <Card className="space-y-2 p-4 bg-white/50 dark:bg-black/50">
        <p className="text-sm font-medium text-gray-900 dark:text-white">Matter</p>
        <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
          Matter bulbs paired in Apple Home or Google Home often still appear on your{' '}
          <strong>Hue Bridge</strong>. This app does not commission Matter in the browser — it
          controls lights <strong>through the Hue bridge</strong>, including Matter‑attached bulbs
          exposed there.
        </p>
      </Card>

      <Card className="space-y-3 p-4 bg-white/50 dark:bg-black/50">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          <p className="text-sm font-medium text-gray-900 dark:text-white">Wheel → room lighting</p>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          On each clock page (0–8), lights match that wheel&apos;s colour. Adjust brightness and
          transition below.
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {CLOCK_HEX.map((hex, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] font-medium"
              style={{ backgroundColor: `${hex}22`, color: hex }}
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: hex }} />
              {clockTitles[i]}
            </div>
          ))}
        </div>
      </Card>

      {/* Bridge connection */}
      <Card className="space-y-4 p-4 bg-white/50 dark:bg-black/50">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-gray-900 dark:text-white">Philips Hue bridge</p>
          {connected ? (
            <span className="text-[11px] font-medium text-green-700 dark:text-green-400">
              Connected
            </span>
          ) : (
            <span className="text-[11px] text-gray-500 dark:text-gray-400">Not paired</span>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="hue-bridge-ip">Bridge IP or hostname</Label>
          <div className="flex flex-wrap gap-2">
            <Input
              id="hue-bridge-ip"
              placeholder="192.168.1.x"
              value={bridgeInput}
              onChange={(e) => setBridgeInput(e.target.value)}
              className="max-w-xs font-mono text-sm"
              autoComplete="off"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={discoverBusy}
              onClick={() => void handleDiscover()}
              className="gap-1.5"
            >
              {discoverBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Find bridges
            </Button>
          </div>
          {discovered.length > 1 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {discovered.map((d, i) => (
                <Button
                  key={`${d.id ?? i}-${d.internalipaddress}`}
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="font-mono text-xs"
                  onClick={() => {
                    const ip = d.internalipaddress ?? ''
                    setBridgeInput(ip)
                    setHueBridgeIp(ip)
                    toast.message(`Using ${ip}`)
                  }}
                >
                  {d.internalipaddress ?? d.id ?? `Bridge ${i + 1}`}
                </Button>
              ))}
            </div>
          ) : null}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Press the physical button on the bridge, then pair within ~30 seconds.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={pairBusy}
            onClick={() => void handlePair()}
            className="gap-1.5"
          >
            {pairBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Pair with bridge
          </Button>
          {connected ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              className="gap-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <Unplug className="h-4 w-4" />
              Disconnect
            </Button>
          ) : null}
        </div>
      </Card>

      {connected ? (
        <>
          <Card className="space-y-4 p-4 bg-white/50 dark:bg-black/50">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="hue-sync-enabled" className="text-sm font-medium">
                Sync wheel colours to Hue
              </Label>
              <input
                id="hue-sync-enabled"
                type="checkbox"
                checked={hueEnabled}
                onChange={(e) => setHueEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 accent-violet-600"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Brightness</span>
                <span className="tabular-nums">{hueBrightness}</span>
              </div>
              <input
                type="range"
                min={1}
                max={254}
                value={hueBrightness}
                onChange={(e) => setHueBrightness(Number(e.target.value))}
                className="h-2 w-full cursor-pointer accent-violet-600"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Transition when wheel changes</span>
                <span className="tabular-nums">{hueTransitionSec.toFixed(1)} s</span>
              </div>
              <input
                type="range"
                min={2}
                max={50}
                step={1}
                value={Math.round(hueTransitionSec * 10)}
                onChange={(e) => setHueTransitionSec(Number(e.target.value) / 10)}
                className="h-2 w-full cursor-pointer accent-violet-600"
              />
            </div>
          </Card>

          <Card className="space-y-3 p-4 bg-white/50 dark:bg-black/50">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Target lights</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-xs"
                disabled={roomsBusy}
                onClick={() => void fetchRooms()}
              >
                {roomsBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Refresh rooms
              </Button>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={hueUseAllLights}
                onChange={(e) => handleAllLightsToggle(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 accent-violet-600"
              />
              All lights on this bridge
            </label>

            {!hueUseAllLights ? (
              <div className="space-y-2">
                {roomsList.length === 0 && !roomsBusy ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    No rooms loaded — check Refresh or bridge firmware (Room groups).
                  </p>
                ) : (
                  <ul className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-black/10 p-2 dark:border-white/10">
                    {roomsList.map((room) => (
                      <li key={room.id}>
                        <label
                          className={cn(
                            'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                            hueRoomIds.includes(room.id)
                              ? 'bg-violet-100 dark:bg-violet-950/50'
                              : 'hover:bg-gray-50 dark:hover:bg-white/5'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={hueRoomIds.includes(room.id)}
                            onChange={() => toggleRoom(room.id)}
                            className="h-4 w-4 shrink-0 rounded border-gray-300 accent-violet-600"
                          />
                          <span className="flex-1 truncate">{room.name}</span>
                          <span className="text-[10px] text-gray-400 tabular-nums">
                            {room.lightIds.length} lights
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
                {!hueUseAllLights && hueRoomIds.length === 0 && roomsList.length > 0 ? (
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Select at least one room, or enable &quot;All lights&quot;.
                  </p>
                ) : null}
              </div>
            ) : null}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-2"
              onClick={() => void handleTestColour()}
            >
              <Wand2 className="h-4 w-4" />
              Test colour (Heart / green)
            </Button>
          </Card>
        </>
      ) : null}
    </div>
  )
}

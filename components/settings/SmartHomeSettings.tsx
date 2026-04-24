'use client'

import { useState } from 'react'
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
} from 'lucide-react'
import { useSettings } from '@/lib/hooks/useSettings'
import { CLOCK_HEX } from '@/lib/hueColors'
import { clockTitles } from '@/lib/clockTitles'
import { cn } from '@/lib/utils'

type PairingStep = 'idle' | 'discovering' | 'discovered' | 'waiting-button' | 'pairing' | 'connected' | 'error'

interface DiscoveredBridge {
  id: string
  internalipaddress: string
  port?: number
}

export function SmartHomeSettings() {
  const {
    hueEnabled, setHueEnabled,
    hueBridgeIp, setHueBridgeIp,
    hueApiKey, setHueApiKey,
    hueBrightness, setHueBrightness,
    hueLightIds,
    setSmartHomeHub,
  } = useSettings()

  const isConnected = !!(hueBridgeIp && hueApiKey)

  const [step, setStep] = useState<PairingStep>(isConnected ? 'connected' : 'idle')
  const [discovered, setDiscovered] = useState<DiscoveredBridge[]>([])
  const [selectedBridge, setSelectedBridge] = useState<string>(hueBridgeIp ?? '')
  const [errorMsg, setErrorMsg] = useState('')

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
        throw new Error('No Hue bridge found on this network. Make sure your bridge is powered on and connected.')
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
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Pairing failed')
      setStep('error')
    }
  }

  // ── Disconnect ────────────────────────────────────────────────────────────

  const handleDisconnect = () => {
    setHueBridgeIp(null)
    setHueApiKey(null)
    setSmartHomeHub(null)
    setStep('idle')
    setDiscovered([])
    setSelectedBridge('')
    setErrorMsg('')
  }

  // ─────────────────────────────────────────────────────────────────────────

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
          Each wheel maps to a specific frequency and hue — grounding the physical space
          in the same colour grammar as the MM.
        </p>

        {/* Node colour preview */}
        <div className="grid grid-cols-3 gap-1.5">
          {CLOCK_HEX.map((hex, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] font-medium"
              style={{ backgroundColor: `${hex}22`, color: hex }}
            >
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: hex }}
              />
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

        {/* Connected state — controls */}
        {isConnected && (
          <>
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
                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                  {hueLightIds.length === 0
                    ? 'All lights on the bridge will respond'
                    : `${hueLightIds.length} light${hueLightIds.length === 1 ? '' : 's'} selected`}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleDisconnect}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
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

            {(step === 'discovered' || step === 'waiting-button') && (
              <div className="space-y-3">
                {discovered.length > 1 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-600 dark:text-gray-400">Select bridge</Label>
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
                  </div>
                )}

                {discovered.length === 1 && (
                  <div className="flex items-center gap-2 rounded-md bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 px-3 py-2">
                    <Wifi className="h-4 w-4 text-green-500 shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-mono">{discovered[0].internalipaddress}</span>
                    <span className="text-xs text-gray-400 ml-auto">Found</span>
                  </div>
                )}

                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-3 space-y-1">
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                    Press the button on your Hue bridge
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Then click Connect within 30 seconds.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('idle')}
                    className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handlePair}
                    className="flex-1 rounded-lg border border-violet-400 dark:border-violet-600 py-2 text-sm font-medium text-violet-700 dark:text-violet-300 bg-violet-50/50 dark:bg-violet-950/20 hover:bg-violet-100/60 dark:hover:bg-violet-900/30 transition-colors"
                  >
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
                <button
                  type="button"
                  onClick={() => setStep('idle')}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                >
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

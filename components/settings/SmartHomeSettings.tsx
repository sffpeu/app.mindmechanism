'use client'

import { Card } from '@/components/ui/card'
import { Lock, Lightbulb, Wifi, CheckCircle2, XCircle } from 'lucide-react'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { useSettings } from '@/lib/hooks/useSettings'
import { cn } from '@/lib/utils'

export function SmartHomeSettings() {
  const { profile } = useAuth()
  const { smartHomeHub } = useSettings()
  const tier = profile?.tier ?? 'open'
  const hasAccess = tier === 'sovereign'

  return (
    <div className="space-y-4">
      {/* ── Explainer ─────────────────────────────────────────────────── */}
      <Card className="p-4 bg-white/50 dark:bg-black/50 space-y-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <p className="text-sm font-medium text-gray-900 dark:text-white">Responsive environment</p>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          The MM maps each wheel's frequency to a colour and intensity. When connected to a
          compatible hub, your room lighting responds in real time as you move between nodes —
          bringing the wheel into the physical space.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {['Root · deep red', 'Sacral · amber', 'Solar Plexus · gold', 'Heart · green',
            'Throat · sky', 'Third Eye · indigo', 'Crown · violet', 'Etheral · white'].map((label) => (
            <span key={label} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              {label}
            </span>
          ))}
        </div>
      </Card>

      {/* ── Hub connections ───────────────────────────────────────────── */}
      {[
        {
          id: 'hue' as const,
          name: 'Philips Hue',
          description: 'Requires Hue Bridge v2 or a Matter-compatible hub. Connect via the Hue Remote API.',
          primary: true,
        },
        {
          id: 'ikea' as const,
          name: 'IKEA Dirigera',
          description: 'Requires IKEA DIRIGERA hub. Connects via the local IKEA Smart Home API.',
          primary: false,
        },
      ].map((hub) => {
        const connected = smartHomeHub === hub.id
        return (
          <Card
            key={hub.id}
            className={cn(
              'p-4 bg-white/50 dark:bg-black/50',
              !hasAccess && 'opacity-70'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <Wifi className={cn('h-4 w-4 shrink-0 mt-0.5', connected ? 'text-green-500' : 'text-gray-400')} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{hub.name}</p>
                    {hub.primary && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-semibold uppercase tracking-wide">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                    {hub.description}
                  </p>
                  {connected && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">Connected</span>
                    </div>
                  )}
                </div>
              </div>
              {!hasAccess
                ? <Lock className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
                : connected
                  ? (
                    <button
                      type="button"
                      disabled
                      className="shrink-0 flex items-center gap-1.5 rounded-md border border-red-200 dark:border-red-800/50 px-2.5 py-1.5 text-xs text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20 cursor-not-allowed opacity-60"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Disconnect
                    </button>
                  )
                  : (
                    <button
                      type="button"
                      disabled
                      className="shrink-0 rounded-md border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-gray-900/30 cursor-not-allowed opacity-60"
                    >
                      Connect
                    </button>
                  )
              }
            </div>
          </Card>
        )
      })}

      {/* ── Tier note ─────────────────────────────────────────────────── */}
      {!hasAccess && (
        <p className="text-xs text-center text-gray-400 dark:text-gray-500 px-2">
          Smart Home integration is available on the Sovereign membership.
        </p>
      )}
    </div>
  )
}

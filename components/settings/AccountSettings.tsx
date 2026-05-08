'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, Mail } from 'lucide-react'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { cn } from '@/lib/utils'

const TIER_CONFIG = {
  open:      { label: 'Open',      color: 'text-gray-500 dark:text-gray-400' },
  standard:  { label: 'Standard',  color: 'text-sky-600 dark:text-sky-400'   },
  sovereign: { label: 'Sovereign', color: 'text-violet-600 dark:text-violet-400' },
} as const

export function AccountSettings() {
  const { user, profile } = useAuth()
  const tier = profile?.tier ?? 'open'
  const tierCfg = TIER_CONFIG[tier]

  const handleManageAccount = () => {
    window.open('https://myaccount.google.com/security', '_blank')
  }

  return (
    <div className="space-y-4">
      {/* ── Membership ────────────────────────────────────────────────── */}
      <Card className="p-4 bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 space-y-3">
        <p className="text-sm font-medium text-gray-900 dark:text-white">Membership</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Tier</span>
          <span className={cn('font-medium tabular-nums', tierCfg.color)}>{tierCfg.label}</span>
        </div>
        {user?.email && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Email</span>
            <span className="text-gray-700 dark:text-gray-300 truncate max-w-[16rem]">{user.email}</span>
          </div>
        )}
        {user?.metadata?.creationTime && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Member since</span>
            <span className="text-gray-700 dark:text-gray-300 tabular-nums">
              {new Date(user.metadata.creationTime).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
              })}
            </span>
          </div>
        )}
      </Card>

      {/* ── Authentication ────────────────────────────────────────────── */}
      <Card className="p-4 bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Google Account</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Password and two-factor authentication</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManageAccount}
            className="flex items-center gap-1.5 shrink-0"
          >
            <Shield className="h-4 w-4" />
            Manage
          </Button>
        </div>
      </Card>
    </div>
  )
}

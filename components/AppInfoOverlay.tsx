'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Info, X, Cpu, User, BookOpen, Scale, Shield, HelpCircle, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { AboutMechanism } from '@/components/info/AboutMechanism'
import { AboutDeveloper } from '@/components/info/AboutDeveloper'
import { AboutESL } from '@/components/info/AboutESL'
import { GettingStarted } from '@/components/info/GettingStarted'
import { FAQ } from '@/components/info/FAQ'
import { PrivacyData } from '@/components/info/PrivacyData'
import { LegalContact } from '@/components/info/LegalContact'

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  {
    id: 'mechanism',
    label: 'About the Mechanism',
    icon: Cpu,
    description: 'What Mind Mechanism is and how it works.',
  },
  {
    id: 'developer',
    label: 'About the Developer',
    icon: User,
    description: 'The person behind the practice.',
  },
  {
    id: 'esl',
    label: 'About ESL',
    icon: BookOpen,
    description: 'The Emotional Spectrum Language — the vocabulary of the interior.',
  },
  {
    id: 'guide',
    label: 'Getting Started',
    icon: Sparkles,
    description: 'Your first steps with the nine mandalas.',
  },
  {
    id: 'faq',
    label: 'FAQ',
    icon: HelpCircle,
    description: 'Frequently asked questions.',
  },
  {
    id: 'privacy',
    label: 'Privacy & Data',
    icon: Shield,
    description: 'What we collect, what we do not, and who owns your practice.',
  },
  {
    id: 'legal',
    label: 'Legal & Contact',
    icon: Scale,
    description: 'Terms, disclaimer, and how to reach us.',
  },
] as const

type TabId = (typeof TABS)[number]['id']


// ─── Tab content ──────────────────────────────────────────────────────────────

function TabContent({ id, clockHex }: { id: TabId; clockHex: string }) {
  const content: Record<TabId, React.ReactNode> = {
    mechanism: <AboutMechanism clockHex={clockHex} />,
    developer: <AboutDeveloper clockHex={clockHex} />,
    esl:       <AboutESL clockHex={clockHex} />,
    guide:     <GettingStarted clockHex={clockHex} />,
    faq:       <FAQ clockHex={clockHex} />,
    privacy:   <PrivacyData clockHex={clockHex} />,
    legal:     <LegalContact clockHex={clockHex} />,
  }

  return <>{content[id]}</>
}


// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
  clockHex: string
  /** Controlled mode: pass open + onOpenChange to drive from a parent (e.g. AppDock).
   *  In controlled mode the internal trigger button is not rendered. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AppInfoOverlay({ clockHex, open: openProp, onOpenChange }: Props) {
  const controlled = openProp !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlled ? openProp! : internalOpen
  const setOpen = (v: boolean) => {
    if (controlled) onOpenChange?.(v)
    else setInternalOpen(v)
  }

  const [activeTab, setActiveTab] = useState<TabId>('mechanism')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const overlay = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 flex flex-col z-[60000] bg-gray-50 dark:bg-gray-950 overflow-hidden"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {/* Subtle clock-colour wash across the top */}
          <div
            className="absolute inset-x-0 top-0 h-[40vh] pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 80% 60% at 20% 0%, ${clockHex}12 0%, transparent 70%)`,
            }}
          />

          {/* Header */}
          <div className="relative shrink-0 flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: clockHex, boxShadow: `0 0 10px ${clockHex}55` }}
              />
              <span className="text-sm font-semibold tracking-wide text-gray-900 dark:text-white">
                Mind Mechanism
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-8 w-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tab bar — horizontally scrollable */}
          <div className="relative shrink-0 border-b border-black/5 dark:border-white/10 overflow-x-auto scrollbar-none">
            <div className="flex items-end gap-0 px-4 min-w-max">
              {TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'relative flex items-center gap-2 px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors duration-150 border-b-2',
                      isActive
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 border-transparent'
                    )}
                    style={isActive ? { borderBottomColor: clockHex, color: clockHex } : { borderBottomColor: 'transparent' }}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content area */}
          <div className="relative flex-1 min-h-0 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <TabContent id={activeTab} clockHex={clockHex} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="relative shrink-0 px-6 py-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
            <p className="text-[10px] text-gray-400 dark:text-gray-600 tracking-widest uppercase">
              Mind Mechanism · The One-Legged Poet
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-600">
              Press <kbd className="px-1 py-0.5 rounded border border-black/10 dark:border-white/10 font-mono text-[9px]">esc</kbd> to close
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <>
      {/* Trigger button — only in uncontrolled (standalone) mode */}
      {!controlled && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open information"
          className="flex items-center justify-center h-8 w-8 rounded-full bg-black/5 dark:bg-white/10 text-black/50 dark:text-white/50 border border-black/10 dark:border-white/15 hover:bg-black/10 dark:hover:bg-white/15 transition-all duration-200"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      )}

      {mounted && createPortal(overlay, document.body)}
    </>
  )
}

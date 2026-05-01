'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'

/**
 * MandalaCeremony
 *
 * A 30-second visual completion ceremony that overlays the clock face
 * when a session timer ends. Sits at z-index 160 (above video overlay
 * at 150, below focus nodes at 400+). Clips to the parent's
 * rounded-full overflow-hidden container — no additional clipping needed.
 *
 * Usage:
 *   {showCeremony && (
 *     <MandalaCeremony
 *       clockHex={clockHex}
 *       onComplete={() => setShowCeremony(false)}
 *     />
 *   )}
 */

interface MandalaCeremonyProps {
  /** The Wheel's accent colour — drives all glow and ring colours */
  clockHex: string
  /** Called when the 30-second sequence finishes (ignored in loop mode) */
  onComplete: () => void
  /** Duration in ms — defaults to 30 000 */
  duration?: number
  /**
   * Loop mode — used for hover animations. Layers pulse continuously
   * and the component never auto-dismisses. Unmount it to stop.
   */
  loop?: boolean
}

export function MandalaCeremony({
  clockHex,
  onComplete,
  duration = 30_000,
  loop = false,
}: MandalaCeremonyProps) {
  const s = duration / 1000   // seconds for Framer Motion

  // Auto-dismiss only in session-completion mode
  useEffect(() => {
    if (loop) return
    const t = setTimeout(onComplete, duration)
    return () => clearTimeout(t)
  }, [loop, duration, onComplete])

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 160 }}
    >
      {/* ── Layer 1: radial bloom from centre ── */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 50% 50%,
            ${clockHex}55 0%,
            ${clockHex}22 35%,
            ${clockHex}08 60%,
            transparent 75%)`,
        }}
        initial={{ opacity: 0, scale: loop ? 1 : 0.6 }}
        animate={loop
          ? { opacity: [0.4, 0.85, 0.4], scale: [1, 1.03, 1] }
          : { opacity: [0, 0.9, 1, 0.7, 0.85, 0.5, 0], scale: [0.6, 1, 1, 1, 1, 1, 1] }
        }
        transition={loop
          ? { duration: 3.5, ease: 'easeInOut', repeat: Infinity }
          : { duration: s, times: [0, 0.08, 0.25, 0.45, 0.6, 0.82, 1], ease: 'easeInOut' }
        }
      />

      {/* ── Layer 2: outer glowing ring at the face edge ── */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          border: `1.5px solid ${clockHex}`,
          boxShadow: `0 0 18px 4px ${clockHex}70,
                      0 0 40px 8px ${clockHex}30,
                      inset 0 0 18px 4px ${clockHex}20`,
        }}
        initial={{ opacity: 0, scale: loop ? 1 : 0.85 }}
        animate={loop
          ? { opacity: [0.5, 1, 0.5], scale: [1, 1.01, 1] }
          : { opacity: [0, 1, 1, 0.8, 1, 0.6, 0], scale: [0.85, 1, 1, 1, 1.01, 1, 1] }
        }
        transition={loop
          ? { duration: 2.8, ease: 'easeInOut', repeat: Infinity }
          : { duration: s, times: [0, 0.1, 0.3, 0.5, 0.65, 0.85, 1], ease: 'easeInOut' }
        }
      />

      {/* ── Layer 3: mid ring — breathes independently ── */}
      <motion.div
        className="absolute rounded-full"
        style={{ inset: '18%', border: `1px solid ${clockHex}45` }}
        initial={{ opacity: 0 }}
        animate={loop
          ? { opacity: [0.2, 0.6, 0.2], scale: [0.98, 1.03, 0.98] }
          : { opacity: [0, 0.6, 0.2, 0.7, 0.2, 0.5, 0], scale: [0.9, 1, 1.04, 0.98, 1.03, 1, 0.98] }
        }
        transition={loop
          ? { duration: 4.2, ease: 'easeInOut', repeat: Infinity, delay: 0.4 }
          : { duration: s, times: [0, 0.12, 0.3, 0.52, 0.7, 0.87, 1], ease: 'easeInOut' }
        }
      />

      {/* ── Layer 4: inner ring — counter-phase ── */}
      <motion.div
        className="absolute rounded-full"
        style={{ inset: '34%', border: `1px solid ${clockHex}35` }}
        initial={{ opacity: 0 }}
        animate={loop
          ? { opacity: [0.15, 0.5, 0.15], scale: [1.02, 0.97, 1.02] }
          : { opacity: [0, 0.3, 0.7, 0.2, 0.6, 0.2, 0], scale: [1, 1.03, 0.98, 1.05, 0.97, 1.02, 1] }
        }
        transition={loop
          ? { duration: 3.8, ease: 'easeInOut', repeat: Infinity, delay: 0.9 }
          : { duration: s, times: [0, 0.15, 0.35, 0.55, 0.72, 0.88, 1], ease: 'easeInOut' }
        }
      />

      {/* ── Layer 5: conic sweep arc ── */}
      <motion.div
        className="absolute inset-0"
        initial={{ rotate: 0, opacity: 0 }}
        animate={loop
          ? { rotate: 360, opacity: [0.4, 0.65, 0.4] }
          : { rotate: [0, 720], opacity: [0, 0.7, 0.7, 0.7, 0] }
        }
        transition={loop
          ? {
              rotate:  { duration: 12, ease: 'linear', repeat: Infinity },
              opacity: { duration: 4, ease: 'easeInOut', repeat: Infinity },
            }
          : {
              rotate:  { duration: s * 0.85, ease: [0.4, 0, 0.2, 1] },
              opacity: { duration: s, times: [0, 0.08, 0.4, 0.82, 1], ease: 'easeInOut' },
            }
        }
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(
              ${clockHex}55 0deg,
              ${clockHex}22 45deg,
              ${clockHex}08 80deg,
              transparent 100deg
            )`,
          }}
        />
      </motion.div>

      {/* ── Layer 6: centre point ── */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: '12%',
          height: '12%',
          top: '44%',
          left: '44%',
          background: `radial-gradient(circle, ${clockHex}cc 0%, ${clockHex}00 100%)`,
        }}
        initial={{ opacity: 0, scale: loop ? 1 : 0 }}
        animate={loop
          ? { opacity: [0.3, 0.8, 0.3], scale: [0.9, 1.15, 0.9] }
          : { opacity: [0, 1, 0.4, 0.9, 0.3, 0.7, 0], scale: [0, 1, 0.7, 1.2, 0.8, 1, 0.5] }
        }
        transition={loop
          ? { duration: 2.5, ease: 'easeInOut', repeat: Infinity, delay: 0.2 }
          : { duration: s, times: [0, 0.1, 0.25, 0.45, 0.62, 0.8, 1], ease: 'easeInOut' }
        }
      />
    </div>
  )
}

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
            ${clockHex}44 0%,
            ${clockHex}18 30%,
            ${clockHex}08 55%,
            ${clockHex}03 72%,
            transparent 90%)`,
        }}
        initial={{ opacity: 0, scale: loop ? 1 : 0.6 }}
        animate={loop
          ? { opacity: [0.25, 0.5, 0.25], scale: [1, 1.02, 1] }
          : { opacity: [0, 0.9, 1, 0.7, 0.85, 0.5, 0], scale: [0.6, 1, 1, 1, 1, 1, 1] }
        }
        transition={loop
          ? { duration: 5.5, ease: 'easeInOut', repeat: Infinity }
          : { duration: s, times: [0, 0.08, 0.25, 0.45, 0.6, 0.82, 1], ease: 'easeInOut' }
        }
      />

      {/* ── Layer 2: outer edge glow — diffuse only, no hard border ── */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          boxShadow: loop
            ? `0 0 40px 16px ${clockHex}28,
               0 0 90px 40px ${clockHex}10,
               inset 0 0 40px 16px ${clockHex}12`
            : `0 0 18px 4px ${clockHex}70,
               0 0 40px 8px ${clockHex}30,
               inset 0 0 18px 4px ${clockHex}20`,
          border: loop ? 'none' : `1.5px solid ${clockHex}`,
        }}
        initial={{ opacity: 0, scale: loop ? 1 : 0.85 }}
        animate={loop
          ? { opacity: [0.3, 0.65, 0.3], scale: [1, 1.005, 1] }
          : { opacity: [0, 1, 1, 0.8, 1, 0.6, 0], scale: [0.85, 1, 1, 1, 1.01, 1, 1] }
        }
        transition={loop
          ? { duration: 4.5, ease: 'easeInOut', repeat: Infinity }
          : { duration: s, times: [0, 0.1, 0.3, 0.5, 0.65, 0.85, 1], ease: 'easeInOut' }
        }
      />

      {/* ── Layer 3: mid ring — breathes independently ── */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: '18%',
          border: loop ? 'none' : `1px solid ${clockHex}45`,
          boxShadow: loop
            ? `0 0 28px 12px ${clockHex}18, inset 0 0 28px 12px ${clockHex}0e`
            : 'none',
        }}
        initial={{ opacity: 0 }}
        animate={loop
          ? { opacity: [0.2, 0.45, 0.2], scale: [0.99, 1.02, 0.99] }
          : { opacity: [0, 0.6, 0.2, 0.7, 0.2, 0.5, 0], scale: [0.9, 1, 1.04, 0.98, 1.03, 1, 0.98] }
        }
        transition={loop
          ? { duration: 6.0, ease: 'easeInOut', repeat: Infinity, delay: 0.6 }
          : { duration: s, times: [0, 0.12, 0.3, 0.52, 0.7, 0.87, 1], ease: 'easeInOut' }
        }
      />

      {/* ── Layer 4: inner ring — counter-phase ── */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: '34%',
          border: loop ? 'none' : `1px solid ${clockHex}35`,
          boxShadow: loop
            ? `0 0 22px 10px ${clockHex}12, inset 0 0 22px 10px ${clockHex}0a`
            : 'none',
        }}
        initial={{ opacity: 0 }}
        animate={loop
          ? { opacity: [0.15, 0.38, 0.15], scale: [1.01, 0.98, 1.01] }
          : { opacity: [0, 0.3, 0.7, 0.2, 0.6, 0.2, 0], scale: [1, 1.03, 0.98, 1.05, 0.97, 1.02, 1] }
        }
        transition={loop
          ? { duration: 5.2, ease: 'easeInOut', repeat: Infinity, delay: 1.4 }
          : { duration: s, times: [0, 0.15, 0.35, 0.55, 0.72, 0.88, 1], ease: 'easeInOut' }
        }
      />

      {/* ── Layer 5: conic sweep arc ── */}
      <motion.div
        className="absolute inset-0"
        initial={{ rotate: 0, opacity: 0 }}
        animate={loop
          ? { rotate: 360, opacity: [0.35, 0.55, 0.35] }
          : { rotate: [0, 720], opacity: [0, 0.7, 0.7, 0.7, 0] }
        }
        transition={loop
          ? {
              rotate:  { duration: 16, ease: 'linear', repeat: Infinity },
              opacity: { duration: 5.5, ease: 'easeInOut', repeat: Infinity },
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
            background: loop
              ? `conic-gradient(
                  ${clockHex}38 0deg,
                  ${clockHex}18 60deg,
                  ${clockHex}06 110deg,
                  transparent 160deg
                )`
              : `conic-gradient(
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
          background: `radial-gradient(circle, ${clockHex}88 0%, ${clockHex}22 50%, ${clockHex}00 100%)`,
        }}
        initial={{ opacity: 0, scale: loop ? 1 : 0 }}
        animate={loop
          ? { opacity: [0.2, 0.55, 0.2], scale: [0.92, 1.08, 0.92] }
          : { opacity: [0, 1, 0.4, 0.9, 0.3, 0.7, 0], scale: [0, 1, 0.7, 1.2, 0.8, 1, 0.5] }
        }
        transition={loop
          ? { duration: 4.0, ease: 'easeInOut', repeat: Infinity, delay: 0.3 }
          : { duration: s, times: [0, 0.1, 0.25, 0.45, 0.62, 0.8, 1], ease: 'easeInOut' }
        }
      />
    </div>
  )
}

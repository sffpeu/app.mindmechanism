'use client'

import { motion } from 'framer-motion'

type Props = {
  clockHex: string
}

/**
 * Soft radial glow behind the clock wheel that slowly breathes in and out.
 * Positioned as the first child of the wheel container (absolute inset-0)
 * so it sits under the clock face, satellites, and focus nodes.
 */
export function ClockBreathingGlow({ clockHex }: Props) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        inset: '-12%',
        background: `radial-gradient(circle, ${clockHex}55 0%, ${clockHex}22 45%, transparent 70%)`,
        zIndex: 0,
      }}
      animate={{
        opacity: [0.5, 1, 0.5],
        scale: [0.92, 1.04, 0.92],
      }}
      transition={{
        duration: 7,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

'use client'

import { motion, AnimatePresence } from 'framer-motion'

type Props = {
  clockHex: string
  /** Hide during active timed sessions — glow serves as a visual timer only when no session is set */
  sessionActive?: boolean
}

export function ClockBreathingGlow({ clockHex, sessionActive }: Props) {
  return (
    <AnimatePresence>
      {!sessionActive && (
        <motion.div
          key="breathing-glow"
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: '-35%',
            background: `radial-gradient(circle, ${clockHex}55 0%, ${clockHex}2a 45%, transparent 72%)`,
            zIndex: 0,
          }}
          initial={{ opacity: 0 }}
          exit={{ opacity: 0, transition: { duration: 2 } }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: 'easeInOut',
            times: [0, 0.5, 1],
          }}
        />
      )}
    </AnimatePresence>
  )
}

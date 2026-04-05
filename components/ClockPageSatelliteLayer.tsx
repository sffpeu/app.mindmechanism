'use client'

import { motion } from 'framer-motion'
import type { SatelliteSettings } from '@/types/ClockSettings'

export function ClockPageSatelliteLayer({
  satellites,
  startDateTime,
  radius = 60,
}: {
  satellites: SatelliteSettings[]
  startDateTime: Date
  radius?: number
}) {
  if (!satellites.length) return null

  const elapsedMilliseconds = Date.now() - startDateTime.getTime()
  const n = satellites.length

  return (
    <>
      {satellites.map((satellite, index) => {
        const satelliteRotation = (elapsedMilliseconds / satellite.rotationTime) * 360
        const totalRotation =
          satellite.rotationDirection === 'clockwise' ? satelliteRotation : -satelliteRotation
        const angle = ((360 / n) * index + totalRotation) % 360
        const radians = (angle * Math.PI) / 180
        const x = 50 + radius * Math.cos(radians)
        const y = 50 + radius * Math.sin(radians)
        const accent = satellite.pulseColor
        const themeFill = !accent
        const glow = accent
          ? `0 0 14px ${accent}cc, 0 0 6px ${accent}`
          : '0 0 12px rgba(0, 0, 0, 0.4)'

        return (
          <motion.div
            key={`satellite-${satellite.id}-${index}`}
            className="absolute cursor-pointer pointer-events-auto"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 1 + index * 0.1,
              duration: 0.5,
              ease: 'easeOut',
            }}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 100,
            }}
            title={satellite.name}
            whileHover={{ scale: 1.25 }}
          >
            {satellite.pulsing ? (
              <motion.div
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: accent, boxShadow: glow }}
                animate={{
                  opacity: [0.15, 1, 0.35, 1, 0.15],
                  scale: [0.88, 1.08, 0.94, 1.04, 0.88],
                }}
                transition={{
                  duration: 1.25,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  times: [0, 0.18, 0.38, 0.62, 1],
                }}
              />
            ) : (
              <div
                className={`h-4 w-4 rounded-full ${themeFill ? 'bg-black dark:bg-white' : ''}`}
                style={{
                  backgroundColor: accent,
                  boxShadow: glow,
                }}
              />
            )}
          </motion.div>
        )
      })}
    </>
  )
}

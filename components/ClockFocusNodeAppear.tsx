'use client'

import { motion } from 'framer-motion'
import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

const STAGGER_S = 0.068
const SPIN_DEG = -112

type Props = HTMLAttributes<HTMLDivElement> & {
  nodeIndex: number
  children: ReactNode
}

/**
 * Focus nodes on clock pages: staggered clockwise entrance with a short spin settle
 * (matches the feel of the clock entrance animation).
 */
export function ClockFocusNodeAppear({ nodeIndex, className, style, children, ...rest }: Props) {
  return (
    <div className={cn('pointer-events-auto', className)} style={style} {...rest}>
      <motion.div
        className="flex h-full w-full min-h-[44px] min-w-[44px] items-center justify-center"
        initial={{ opacity: 0, scale: 0.28, rotate: SPIN_DEG }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{
          delay: nodeIndex * STAGGER_S,
          opacity: { duration: 0.26 },
          scale: { type: 'spring', damping: 17, stiffness: 270 },
          rotate: { type: 'spring', damping: 12, stiffness: 158 },
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}

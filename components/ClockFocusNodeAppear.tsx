'use client'

import { motion } from 'framer-motion'
import type { ComponentPropsWithoutRef } from 'react'

/** Matches `renderSatellites` on numbered clock pages (staggered fade + scale from center). */
const BASE_DELAY_S = 1
const STAGGER_S = 0.1
const DURATION_S = 0.5

/** Use `motion.div` prop types so spread `rest` matches `MotionProps` (DOM `onDrag*` / `onAnimation*` differ). */
type Props = Omit<
  ComponentPropsWithoutRef<typeof motion.div>,
  'initial' | 'animate' | 'transition'
> & {
  nodeIndex: number
}

/**
 * Focus nodes on clock pages: same entrance as orbiting satellite dots (staggered, easeOut scale-in).
 */
export function ClockFocusNodeAppear({ nodeIndex, className, style, children, ...rest }: Props) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: BASE_DELAY_S + nodeIndex * STAGGER_S,
        duration: DURATION_S,
        ease: 'easeOut',
      }}
      {...rest}
    >
      <div className="flex h-full w-full min-h-[44px] min-w-[44px] items-center justify-center">
        {children}
      </div>
    </motion.div>
  )
}

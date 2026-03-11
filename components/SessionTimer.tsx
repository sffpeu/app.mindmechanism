'use client'

import Timer from './Timer'
import { useSessionTimer } from '@/lib/useSessionTimer'

interface SessionTimerProps {
  duration?: number | null
  sessionId?: string | null
  onSessionComplete?: () => void
  /** When provided, timer is controlled (e.g. for sharing state with SessionProgressRing). */
  remainingTime?: number | null
  isPaused?: boolean
  onPauseResume?: () => void
  /** Initial session duration in ms (for controlled mode). */
  initialDuration?: number | null
}

function SessionTimerUncontrolled({
  duration,
  sessionId,
  onSessionComplete
}: {
  duration: number | null
  sessionId: string | null
  onSessionComplete?: () => void
}) {
  const { remainingTime, isPaused, onPauseResume } = useSessionTimer(duration, sessionId, onSessionComplete)
  if (remainingTime == null) return null
  return (
    <div className="flex flex-col items-center gap-1.5 w-full max-w-[200px]">
      <Timer remainingTime={remainingTime} isPaused={isPaused} onPauseResume={onPauseResume} />
    </div>
  )
}

export function SessionTimer(props: SessionTimerProps) {
  if (props.remainingTime !== undefined) {
    if (props.remainingTime == null) return null
    return (
      <div className="flex flex-col items-center gap-1.5 w-full max-w-[200px]">
        <Timer
          remainingTime={props.remainingTime}
          isPaused={props.isPaused ?? false}
          onPauseResume={props.onPauseResume ?? (() => {})}
        />
      </div>
    )
  }
  return (
    <SessionTimerUncontrolled
      duration={props.duration ?? null}
      sessionId={props.sessionId ?? null}
      onSessionComplete={props.onSessionComplete}
    />
  )
}

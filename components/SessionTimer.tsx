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
  /** Initial session duration in ms; when provided with remainingTime, a progress bar is shown at the bottom. */
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
  const initialDuration = duration ?? null
  return (
    <div className="flex flex-col items-center gap-1.5 w-full max-w-[200px]">
      <Timer remainingTime={remainingTime} isPaused={isPaused} onPauseResume={onPauseResume} />
      {initialDuration != null && initialDuration > 0 && remainingTime != null && (
        <div className="w-full h-1 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden" role="progressbar" aria-valuenow={1 - remainingTime / initialDuration} aria-valuemin={0} aria-valuemax={1}>
          <div
            className="h-full rounded-full bg-blue-500 dark:bg-blue-400 transition-[width] duration-150 ease-linear"
            style={{ width: `${Math.min(100, (100 * (initialDuration - remainingTime)) / initialDuration)}%` }}
          />
        </div>
      )}
    </div>
  )
}

export function SessionTimer(props: SessionTimerProps) {
  if (props.remainingTime !== undefined) {
    if (props.remainingTime == null) return null
    const initialDuration = props.initialDuration ?? props.duration ?? null
    return (
      <div className="flex flex-col items-center gap-1.5 w-full max-w-[200px]">
        <Timer
          remainingTime={props.remainingTime}
          isPaused={props.isPaused ?? false}
          onPauseResume={props.onPauseResume ?? (() => {})}
        />
        {initialDuration != null && initialDuration > 0 && (
          <div className="w-full h-1 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden" role="progressbar" aria-valuenow={1 - props.remainingTime / initialDuration} aria-valuemin={0} aria-valuemax={1}>
            <div
              className="h-full rounded-full bg-blue-500 dark:bg-blue-400 transition-[width] duration-150 ease-linear"
              style={{ width: `${Math.min(100, (100 * (initialDuration - props.remainingTime)) / initialDuration)}%` }}
            />
          </div>
        )}
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

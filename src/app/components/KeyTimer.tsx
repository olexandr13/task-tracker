import { useEffect, useState } from 'react'
import { toLocalDay } from '../../core'
import { DROP_TIMER_LABEL } from '../caseLabels'

/** What the timer shows: when the daily case arrives, or null when there is none. */
interface KeyTimerProps {
  readonly at: Date | null
}

/** `1h 2m 3s`, `2m 3s`, or `3s`. Hours and minutes are left off while they are zero. */
function describeRemaining(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const parts: string[] = []
  if (hours > 0) parts.push(`${String(hours)}h`)
  if (minutes > 0 || hours > 0) parts.push(`${String(minutes)}m`)
  parts.push(`${String(seconds)}s`)
  return parts.join(' ')
}

/**
 * A countdown on today's Drop (CHST-28). Ticks every second until that
 * moment. Another day's time shows nothing: tomorrow is not counted. The
 * arrival is one instant, so a parent handing a fresh Date for the same time
 * does not start the second over.
 */
export function KeyTimer({ at }: KeyTimerProps) {
  const due = at?.getTime() ?? null
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (due === null) return
    const id = window.setInterval(() => { setNow(Date.now()) }, 1000)
    return () => { window.clearInterval(id) }
  }, [due])

  if (due === null || toLocalDay(new Date(due)) !== toLocalDay(new Date(now))) return null

  return (
    <div role="timer" aria-label={DROP_TIMER_LABEL} className="flex items-center justify-center gap-1.5 leading-none">
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-amber-500 motion-safe:animate-pulse dark:bg-amber-300" />
      <p className="text-[10px] font-medium tracking-[0.12em] text-neutral-500 uppercase dark:text-neutral-400">Arrives in</p>
      <p className="text-xs font-semibold text-amber-700 tabular-nums dark:text-amber-300">{describeRemaining(due - now)}</p>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { CaseLock } from './CaseLock'

interface KeyTimerProps {
  /** When the case arrives, or null when there is nothing to wait for. */
  readonly at: Date | null
  /** What the timer is called for someone who cannot see it: `Time until the Drop`. */
  readonly label: string
}

const MINUTE_MS = 60_000
const DAY_MINUTES = 24 * 60

/**
 * `2d 3h`, `1h 2m` or `2m`. A day or more away reads in days and hours
 * (CHST-30); under that, the hours are left off while they are zero. Minutes
 * are rounded up, so the last minute reads `1m` rather than `0m`.
 */
function describeRemaining(remainingMs: number): string {
  const totalMinutes = Math.max(0, Math.ceil(remainingMs / MINUTE_MS))
  const days = Math.floor(totalMinutes / DAY_MINUTES)
  const hours = Math.floor((totalMinutes % DAY_MINUTES) / 60)
  const minutes = totalMinutes % 60

  if (days > 0) return `${String(days)}d ${String(hours)}h`
  return hours > 0 ? `${String(hours)}h ${String(minutes)}m` : `${String(minutes)}m`
}

/**
 * A countdown on a case still on its way: today's Drop (CHST-29) and Weekly,
 * to Monday (CHST-30). It checks the clock every second, so the minute turns
 * over on time, and shows nothing once the arrival has passed: by then the
 * case is ready. The arrival is one instant, so a parent handing a fresh Date
 * for the same time does not start the count over.
 *
 * It is the case's padlock (CHST-31): it sits on the crate, and goes with
 * the countdown, so a case whose time has come is left with no lock on it.
 */
export function KeyTimer({ at, label }: KeyTimerProps) {
  const due = at?.getTime() ?? null
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (due === null) return
    const id = window.setInterval(() => { setNow(Date.now()) }, 1000)
    return () => { window.clearInterval(id) }
  }, [due])

  if (due === null || due <= now) return null

  return (
    <CaseLock role="timer" label={label}>
      <span className="text-[11px] text-neutral-300">Arrives in</span>{' '}
      <span className="text-[13px] font-semibold text-amber-300 tabular-nums">{describeRemaining(due - now)}</span>
    </CaseLock>
  )
}

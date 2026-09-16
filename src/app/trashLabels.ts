import { msUntilPurge, type Task } from '../core'

/**
 * How the trash reads on screen. The rules themselves live in ../core; wording
 * is presentation, so it stays here — the same split as ./repeatLabels.
 */

const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS

/**
 * What is about to happen to a task in the trash, and roughly when. Whole hours
 * while there is more than one to go, minutes below that: an exact countdown
 * would be noise on something that lasts a day.
 */
export function describeTimeLeft(task: Task, now: Date = new Date()): string {
  const left = msUntilPurge(task, now)
  if (left <= 0) {
    return 'Going now'
  }

  if (left < HOUR_MS) {
    // Never "in 0 minutes": there is time left, so the smallest it reads is one.
    return `Gone for good in ${countOf(Math.max(1, Math.round(left / MINUTE_MS)), 'minute')}`
  }

  return `Gone for good in ${countOf(Math.round(left / HOUR_MS), 'hour')}`
}

function countOf(count: number, noun: string): string {
  return `${String(count)} ${noun}${count === 1 ? '' : 's'}`
}

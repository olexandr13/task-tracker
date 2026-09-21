/**
 * A running timer against a task: elapsed time from when it was started, and
 * whether that run has reached the task's time goal together with time already
 * logged. The run itself is kept on the device; these helpers only read the
 * numbers.
 */

/** Whole seconds from `startedAt` to `now`, never below zero. */
export function elapsedSeconds(startedAt: string, now: Date = new Date()): number {
  const started = Date.parse(startedAt)
  if (Number.isNaN(started)) return 0
  return Math.max(0, Math.floor((now.getTime() - started) / 1000))
}

/** Whole minutes completed since `startedAt` (floor of elapsed seconds / 60). */
export function elapsedMinutesFloor(startedAt: string, now: Date = new Date()): number {
  return Math.floor(elapsedSeconds(startedAt, now) / 60)
}

/**
 * Whether minutes already logged plus the live run have reached the goal.
 * No goal means never exceeded. Live seconds count as floor minutes so a
 * notification matches what Stop would log.
 */
export function isGoalExceeded(args: {
  readonly spent: number
  readonly elapsedSeconds: number
  readonly goal: number | null
}): boolean {
  if (args.goal === null) return false
  const liveMinutes = Math.floor(args.elapsedSeconds / 60)
  return args.spent + liveMinutes >= args.goal
}

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

/**
 * Whether the seconds already logged plus the live run have reached the goal
 * (in minutes). No goal means never exceeded. Both are added to the second, as
 * Stop logs the run, so the notice matches the time Stop would leave.
 */
export function isGoalExceeded(args: {
  readonly spentSeconds: number
  readonly elapsedSeconds: number
  readonly goal: number | null
}): boolean {
  if (args.goal === null) return false
  return args.spentSeconds + args.elapsedSeconds >= args.goal * 60
}

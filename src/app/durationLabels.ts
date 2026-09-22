/**
 * How time spent reads on screen, and how it is typed. The rules for goals and
 * sessions live in ../core; wording is presentation, so it stays here.
 */

/** `45m`, `1h`, `1h 30m`. */
export function describeDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${String(rest)}m`
  return rest === 0 ? `${String(hours)}h` : `${String(hours)}h ${String(rest)}m`
}

/**
 * A session's length in whole minutes, as time is shown everywhere: its seconds
 * count toward the total, not on screen. A timer's run under a minute is `<1m`.
 */
export function describeSessionLength(seconds: number): string {
  return seconds < 60 ? '<1m' : describeDuration(Math.floor(seconds / 60))
}

/** As `describeDuration`, closed up to fit under a row's control: `1h30`. */
function describeDurationShort(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${String(rest)}m`
  return rest === 0 ? `${String(hours)}h` : `${String(hours)}h${String(rest).padStart(2, '0')}`
}

/** What a row spells out under its clock: `20m/1h`, or the time alone without a goal: `20m`. */
export function describeTimeProgress(spent: number, goal: number | null): string {
  return goal === null ? describeDurationShort(spent) : `${describeDurationShort(spent)}/${describeDurationShort(goal)}`
}

/** What the clock says about itself, to a screen reader and as its tooltip: `20m of 1h`. */
export function describeTimeSummary(spent: number, goal: number | null): string {
  if (goal === null) return spent === 0 ? 'No time goal' : `${describeDuration(spent)} spent`
  return `${describeDuration(spent)} of ${describeDuration(goal)}`
}

/**
 * A live run as a clock: `0:45`, `12:05`, `1:02:03`. Seconds always show so a
 * short run is still visibly moving.
 */
export function describeElapsedClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  const mm = String(minutes).padStart(hours > 0 ? 2 : 1, '0')
  const ss = String(rest).padStart(2, '0')
  return hours > 0 ? `${String(hours)}:${mm}:${ss}` : `${String(minutes)}:${ss}`
}

/** What a row says while a timer is running: `12m running`. */
export function describeTimerRunning(elapsedSeconds: number): string {
  const minutes = Math.floor(elapsedSeconds / 60)
  return `${describeDurationShort(minutes)} running`
}

/** When a session was logged: its time today, or the day and time before that. */
export function describeLoggedAt(loggedAt: string, now: Date): string {
  const at = new Date(loggedAt)
  const time = new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(at)
  const sameDay =
    at.getFullYear() === now.getFullYear() && at.getMonth() === now.getMonth() && at.getDate() === now.getDate()
  if (sameDay) return time
  return `${new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(at)}, ${time}`
}

const MINUTES = String.raw`(?:m|min|mins|minutes?)`
const HOURS = String.raw`(?:h|hr|hrs|hours?)`

/** `90`, `90m`, `90 min`. */
const JUST_MINUTES = new RegExp(String.raw`^(\d+)\s*${MINUTES}?$`)
/** `1h`, `1.5h`, `1h30`, `1h 30m`, `2 hours 15 min`. */
const HOURS_AND_MINUTES = new RegExp(String.raw`^(\d+(?:[.,]\d+)?)\s*${HOURS}\s*(?:(\d+)\s*${MINUTES}?)?$`)
/** `1:30`. */
const CLOCK = /^(\d+):([0-5]\d)$/

/**
 * Minutes from what was typed, the ways a person writes a length of time: a
 * bare number is minutes. Null for anything else. Whether the length is one a
 * goal or a session can be is the caller's to ask of ../core.
 */
export function parseDuration(text: string): number | null {
  const typed = text.trim().toLowerCase()

  const clock = CLOCK.exec(typed)
  if (clock !== null) return Number(clock[1]) * 60 + Number(clock[2])

  const minutes = JUST_MINUTES.exec(typed)
  if (minutes !== null) return Number(minutes[1])

  const hours = HOURS_AND_MINUTES.exec(typed)
  if (hours !== null) return Math.round(Number(hours[1]?.replace(',', '.')) * 60) + Number(hours[2] ?? 0)

  return null
}

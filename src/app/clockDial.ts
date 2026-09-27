import { InvalidTimeOfDayError, isLocalTime, toLocalTime, type LocalTime } from '../core'

/**
 * The face of a clock, and the hour it is set to: where each number sits, which
 * one a pointer is over, and the hour that comes of picking it (DUE-24).
 *
 * The clock is a twenty-four hour one, so an hour picked off it is the hour of
 * the day outright, with no half of the day left to say. The day's hours are
 * written in two rings at the same twelve angles — 0 to 11 outside, 12 to 23
 * inside — so a ring in is twelve hours on. The minutes have the face to
 * themselves, sixty round the outer ring, once the hour is said.
 *
 * What the face hands back is a `LocalTime` like any other, which is what a task
 * is due at, with nothing in between to keep in step.
 *
 * Angles run clockwise from the top, which is midnight — noon a ring in — and step 0.
 */

/** Which half of the hour the dial is setting: the hour on the face, or the minutes round it. */
export type DialUnit = 'hour' | 'minute'

/** Which ring of the face a number sits on: the day's first half outside, its second inside. */
export type DialRing = 'outer' | 'inner'

/** The steps each dial is divided into: twelve angles on the face, sixty minutes round it. */
export const DIAL_STEPS: Readonly<Record<DialUnit, number>> = { hour: 12, minute: 60 }

/** The hours in a day, which is what the two rings hold between them. */
export const DAY_HOURS = 24

/** The hours written round each ring, from the top, clockwise. */
export const HOUR_LABELS: Readonly<Record<DialRing, readonly number[]>> = {
  outer: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  inner: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
}

/** The minutes written round the face: every fifth, as a clock is marked. */
export const MINUTE_LABELS: readonly number[] = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

/**
 * How far out from the middle each ring sits, as a fraction of the face's width.
 * The minutes, having the face to themselves, ride the outer ring.
 */
export const RING_RADIUS: Readonly<Record<DialRing, number>> = { outer: 0.41, inner: 0.25 }

/** The step a value sits at on its dial — the angle of an hour, or of a minute. */
export function stepOf(value: number, unit: DialUnit): number {
  return unit === 'hour' ? value % 12 : value
}

/** The ring an hour is written on. */
export function ringOf(hour: number): DialRing {
  return hour < 12 ? 'outer' : 'inner'
}

/** The hour written at a step of a ring. */
export function hourAt(step: number, ring: DialRing): number {
  return wrapStep(step, 12) + (ring === 'inner' ? 12 : 0)
}

/**
 * The ring a point is on, by how far out from the middle it lies, as a fraction
 * of the face's width. The parting is half way between the two rings; anything
 * further out than the outer ring is still the outer ring, so a hand dragged
 * past the numbers keeps its grip.
 */
export function ringAtDistance(distance: number): DialRing {
  return distance < (RING_RADIUS.outer + RING_RADIUS.inner) / 2 ? 'inner' : 'outer'
}

/** A step brought back onto the face, so stepping past the end comes round to the start. */
export function wrapStep(step: number, steps: number): number {
  return ((step % steps) + steps) % steps
}

/**
 * Where a step sits on the face, as a fraction of its radius from the middle:
 * x to the right, y **down**, as the screen counts. Step 0 is at the top.
 */
export function stepOffset(step: number, steps: number): { x: number; y: number } {
  const angle = (2 * Math.PI * step) / steps
  return { x: Math.sin(angle), y: -Math.cos(angle) }
}

/**
 * The step a point is over, measured from the middle of the face with y down.
 * How far out it is does not matter — only the way it lies — so a hand dragged
 * past the numbers keeps its grip. The middle itself has no direction, and reads
 * as the top.
 */
export function stepAtPoint(x: number, y: number, steps: number): number {
  // The exact middle lies no way at all: it reads as the top rather than as
  // whichever way a negative zero happens to point.
  const angle = Math.atan2(x, y === 0 ? 0 : -y)
  return wrapStep(Math.round((angle * steps) / (2 * Math.PI)), steps)
}

/** The hours and minutes of a time. Throws on anything that is not one. */
export function timeParts(time: LocalTime): { hour: number; minute: number } {
  if (!isLocalTime(time)) throw new InvalidTimeOfDayError(time)
  const [hour, minute] = time.split(':').map(Number)
  return { hour, minute }
}

/** The time those hours and minutes make, each brought inside the day. */
export function timeAt(hour: number, minute: number): LocalTime {
  const hours = String(wrapStep(hour, DAY_HOURS)).padStart(2, '0')
  const minutes = String(wrapStep(minute, 60)).padStart(2, '0')
  return `${hours}:${minutes}`
}

/** The same time at that hour of the day, the minutes kept. */
export function withHour(time: LocalTime, hour: number): LocalTime {
  return timeAt(hour, timeParts(time).minute)
}

export function withMinute(time: LocalTime, minute: number): LocalTime {
  return timeAt(timeParts(time).hour, minute)
}

/**
 * Where the dial opens when the task has no hour yet: the hour coming, on the
 * hour. Nothing is set by opening there — it is only somewhere to start, and
 * the likeliest place, a task being set for later in the day rather than earlier.
 */
export function comingHour(now: Date): LocalTime {
  const { hour } = timeParts(toLocalTime(now))
  return timeAt(hour + 1, 0)
}

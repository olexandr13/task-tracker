import type { HourSlot, HoursWindow, LocalTime } from '../core'
import type { NotifyPermission } from './browserNotification'
import { describeTimeOfDay } from './dueLabels'

/**
 * How the check-in reads on screen: the hours it asks about, the question it
 * asks, and what there is to say about how far it can reach (CHECKIN-1).
 *
 * The words for the mode itself — what it is for, what it does — are with the
 * other modes' (`modeLabels`).
 */

function onTheHour(hour: number): LocalTime {
  return `${String(hour % 24).padStart(2, '0')}:00`
}

/** The hour as its start: `09:00`. */
export function describeHour(hour: number): string {
  return describeTimeOfDay(onTheHour(hour))
}

/** Hours from one time to another: `09:00–22:00`. */
export function describeHours({ from, to }: HoursWindow): string {
  return `${describeTimeOfDay(from)}–${describeTimeOfDay(to)}`
}

/** An hour of a day as the stretch it is: `14:00–15:00`. */
export function describeSlot(slot: HourSlot): string {
  return `${onTheHour(slot.hour)}–${onTheHour(slot.hour + 1)}`
}

/** What the check-in asks (CHECKIN-4): `What did you do 14:00–15:00?` */
export function describeCheckInQuestion(slot: HourSlot): string {
  return `What did you do ${describeSlot(slot)}?`
}

/** The day's other hours still to log, beside the question: `2 more hours not logged today`. */
export function describeOthersNotLogged(others: number): string | null {
  if (others === 0) return null
  return others === 1 ? '1 more hour not logged today' : `${String(others)} more hours not logged today`
}

/**
 * The other side of the hours, which is the half worth saying outright: the
 * stretch nothing is asked about. Hours from one time to the same time shut
 * nothing out, and say so.
 */
export function describeCheckInSilence({ from, to }: HoursWindow): string {
  if (from === to) {
    return `Both ends at ${describeTimeOfDay(from)} means every hour: it asks all day and all night.`
  }
  return `It asks nothing about the hours between ${describeTimeOfDay(to)} and ${describeTimeOfDay(from)}.`
}

/**
 * What there is to say about this browser's notifications while the app is
 * open, or null where there is nothing to say. Everything is on screen too, so
 * this says what is being missed rather than that the check-in is broken.
 */
export function describeCheckInPermission(permission: NotifyPermission): string | null {
  switch (permission) {
    case 'denied':
      return 'This browser is blocking notifications, so check-ins only show on screen. Allow them in the site’s settings to have them reach you elsewhere.'
    case 'unavailable':
      return 'This browser has no notifications, so check-ins only show on screen.'
    case 'default':
      return 'Allow notifications when the browser asks, or check-ins only show on screen.'
    case 'granted':
      return null
  }
}

/** The switch that has this device reached while the app is closed (CHECKIN-11). */
export const PUSH_SWITCH = {
  label: 'Notify this device when PickMe is closed',
  description: 'Check-ins arrive as notifications on this device, even with the app closed.',
} as const

/** Why this browser cannot be reached while the app is closed, and what would do (CHECKIN-11). */
export function describePushSupport(support: 'not-set-up' | 'no-worker' | 'install-first' | 'unsupported' | 'guest'): string {
  switch (support) {
    case 'not-set-up':
      return 'Notifications while PickMe is closed are not set up for this app yet.'
    case 'no-worker':
      return 'This works in the installed app and on the website, but not on the development server.'
    case 'install-first':
      return 'On iPhone and iPad, add PickMe to the Home Screen first: press "Share", then "Add to Home Screen". Open it from there and turn this on.'
    case 'unsupported':
      return 'This browser can’t receive notifications while PickMe is closed.'
    case 'guest':
      return 'Sign in with Google to get check-ins while PickMe is closed.'
  }
}

/** What came of turning it on, or of a test (CHECKIN-11, CHECKIN-12), or null for nothing to say. */
export function describePushOutcome(outcome: 'blocked' | 'failed' | 'test-sent' | 'test-failed' | null): string | null {
  switch (outcome) {
    case 'blocked':
      return 'This browser is blocking notifications. Allow them in the site’s settings, then turn this on again.'
    case 'failed':
      return 'Couldn’t turn this on. Try again.'
    case 'test-sent':
      return 'Test sent. It should arrive in a few seconds, even if you close PickMe now.'
    case 'test-failed':
      return 'Couldn’t send a test. Check your connection and try again.'
    case null:
      return null
  }
}

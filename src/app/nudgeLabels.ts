import type { NudgeWindow, QuietHours } from '../core'
import type { NotifyPermission } from './browserNotification'
import { describeTimeOfDay } from './dueLabels'

/**
 * How the nudge reads on screen: the span it waits for, the hours it may speak
 * in, and what there is to say about the browser it is speaking through.
 *
 * The words for the mode itself — what it is for, what it does — are with the
 * other modes' (`modeLabels`).
 */

/** The span waited for, as its own control writes it: `2h`. */
export function describeQuietSpan(hours: QuietHours): string {
  return `${String(hours)}h`
}

/** The hours it may speak in: `09:00–22:00`. */
export function describeNudgeWindow({ from, to }: NudgeWindow): string {
  return `${describeTimeOfDay(from)}–${describeTimeOfDay(to)}`
}

/**
 * The other side of the hours, which is the half worth saying outright: the
 * stretch nothing is said in. Hours from one time to the same time shut nothing
 * out, and say so rather than naming an empty stretch.
 */
export function describeNudgeSilence({ from, to }: NudgeWindow): string {
  if (from === to) {
    return `Both ends at ${describeTimeOfDay(from)} is any hour at all — nothing is held back.`
  }
  return `Nothing is said between ${describeTimeOfDay(to)} and ${describeTimeOfDay(from)}.`
}

/**
 * What there is to add about the browser, or null where there is nothing: a
 * notification is the second way of hearing a nudge and never the only one, so
 * this says what is being missed rather than warning that the nudge is broken.
 */
export function describeNotifyPermission(permission: NotifyPermission): string | null {
  switch (permission) {
    case 'denied':
      return 'This browser is blocking notifications, so the nudge will only show on screen. Allow them in the site’s settings to have it reach you elsewhere.'
    case 'unavailable':
      return 'This browser has no notifications, so the nudge will only show on screen.'
    case 'default':
      return 'Allow notifications when the browser asks, or the nudge will only show on screen.'
    case 'granted':
      return null
  }
}

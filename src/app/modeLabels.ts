import type { HoursWindow, NudgeWindow, QuietHours, WarmUpProgress } from '../core'
import { describeHours } from './checkInLabels'
import { describeNudgeWindow, describeQuietSpan } from './nudgeLabels'
import { describeDaysLeft, describeWarmUpDay } from './warmUpLabels'
import { VIEW_LABELS, type ModeView } from './view'

/**
 * How the modes read on screen: the line each one is summed up in, what it does
 * at length on its own page, and how its state is said.
 *
 * The modes are the parts of the app that are turned on and off rather than
 * used — Procrastination, the warm-up, the nudge and the check-in. Each changes how the rest
 * of the app behaves for a while, which is exactly what is hard to guess from a
 * switch, so each says what it does in its own words (MODE-5).
 */

/** What a mode is for, in the one line its row on the Modes page has (MODE-2). */
export const MODE_SUMMARY: Record<ModeView, string> = {
  'modes/procrastination': 'One task out of Today, and everything else dimmed until it is done.',
  'modes/warm-up': 'Increase your productivity gradually: one new habit a day, for thirty days.',
  'modes/nudge': 'Speaks up when nothing has been finished for a while, and names the task to pick up.',
  'modes/check-in': 'Asks at the top of every hour what you did, so your day gets logged as it goes.',
}

/**
 * What a mode does, on its own page (MODE-5). Plain sentences, one thing each,
 * naming the controls they mean in quotes: this is the page that has to be
 * understood before the switch is touched, so it says things outright rather
 * than hinting at them, and stops well short of a wall of prose.
 */
export const MODE_POINTS: Record<ModeView, readonly string[]> = {
  'modes/procrastination': [
    'Focus on just one important task.',
    'Dims everything else — the other tasks, the progress bars, the quote, and the menu apart from "Today", which stays lit as the way back to the task.',
    'Could be activated by pressing "P" button.',
  ],
  'modes/warm-up': [
    'Lets you increase your productivity gradually. No rush, no extra effort, and no promises to yourself you end up breaking.',
    'Allows only one new habit a day: 1 habit on day one, 2 habits on day two and so on.',
    'Turn on "Pause" to hold the allowance where it is. Days on pause add no habit, and the habits you already have stay.',
    'Ends automatically after 30 days.',
  ],
  // What the nudge watches for and what it names is the line it is summed up in
  // (`MODE_SUMMARY`), and what there is to set is the "Settings" below; this is
  // the rest of it — how it arrives, and how far its reach goes.
  'modes/nudge': [
    'Shows a notice at the foot of the app — press it to go straight to that task — and a browser notification too, but only while the app is open.',
  ],
  // The hours it keeps to are the "Settings" below; this is what it asks, when,
  // and how it arrives.
  'modes/check-in': [
    'At 10:00, 11:00, 12:00 and so on, it asks what you did in the hour that just ended.',
    'It only asks about the hours between "From" and "To" below, and skips an hour you have already logged.',
    'It shows a notice at the foot of the app. Press "Log it" to open the Activity log on that hour.',
    'While PickMe is open, it sends a browser notification too. Nothing reaches you while PickMe is closed.',
  ],
}

/** The tooltip on a mode's row: that there is more to read behind it (MODE-4). */
export function describeModeHint(view: ModeView): string {
  return `Open ${VIEW_LABELS[view]} for what it does`
}

/**
 * Where a mode stands, in the two places it is said (MODE-3): whether it is on,
 * in a word under its own switch, and whatever else there is to say about it,
 * beside the mode itself.
 *
 * Split in two because the switch is what the word belongs to — a switch says
 * nothing about which way is on until something beside it does — while `Day 3
 * of 30 · 27 days left` is about the mode, and far too long to stand under a
 * thumb-sized control.
 */
export interface ModeStatus {
  /** `Enabled`, `Disabled`, or `Loading…` while it is not known yet (MODE-8). */
  readonly state: string
  /** What else there is to say — `Resting`, `Day 3 of 30 · 27 days left` — or null. */
  readonly detail: string | null
}

/** A mode turned on and off, in the word under its switch (MODE-3). */
export const MODE_ENABLED = 'Enabled'
export const MODE_DISABLED = 'Disabled'

/** Where Procrastination mode stands, for its row and the head of its page (MODE-3). */
export function describeProcrastinationStatus(
  phase: 'off' | 'idle' | 'focus' | 'won',
  available: boolean,
): ModeStatus {
  switch (phase) {
    case 'focus':
      return { state: MODE_ENABLED, detail: 'One task in front of you' }
    case 'won':
      return { state: MODE_ENABLED, detail: 'A win to enjoy' }
    case 'idle':
      return { state: MODE_ENABLED, detail: 'Resting' }
    default:
      return { state: MODE_DISABLED, detail: available ? null : NOTHING_TO_FOCUS_ON }
  }
}

/** Why Procrastination mode cannot be turned on just now (JUST-2). */
export const NOTHING_TO_FOCUS_ON = 'Nothing to do in Today'

/**
 * Where a mode stands while its data is still on its way, and why it cannot be
 * switched yet (MODE-8). `Disabled` would be a lie — and worse than a lie on the
 * warm-up, whose switch would start a fresh month over the one already running.
 */
export const MODE_LOADING: ModeStatus = { state: 'Loading…', detail: null }
export const MODE_NOT_LOADED = 'Still loading.'

/**
 * Where the nudge stands: the span it is waiting for, and the hours it keeps to
 * where it keeps to any (MODE-3). Off, there is nothing to add — a span nothing
 * is being measured against says nothing about the app as it is now.
 */
export function describeNudgeStatus(
  on: boolean,
  quietHours: QuietHours,
  window: NudgeWindow | null,
): ModeStatus {
  if (!on) return { state: MODE_DISABLED, detail: null }

  const span = `After ${describeQuietSpan(quietHours)} with nothing done`
  return {
    state: MODE_ENABLED,
    detail: window === null ? span : `${span} · ${describeNudgeWindow(window)}`,
  }
}

/** Where the check-in stands: the hours it asks about, while it is on (MODE-3). */
export function describeCheckInStatus(on: boolean, window: HoursWindow): ModeStatus {
  if (!on) return { state: MODE_DISABLED, detail: null }
  return { state: MODE_ENABLED, detail: `Every hour · ${describeHours(window)}` }
}

/** Where the warm-up stands: how far through its month it is, or that there is none (MODE-3). */
export function describeWarmUpStatus(progress: WarmUpProgress | null): ModeStatus {
  if (progress === null) return { state: MODE_DISABLED, detail: null }
  const place = `${describeWarmUpDay(progress)} · ${describeDaysLeft(progress)}`
  return { state: MODE_ENABLED, detail: progress.paused ? `Paused · ${place}` : place }
}

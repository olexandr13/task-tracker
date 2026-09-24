import type { WarmUpProgress } from '../core'
import { describeDaysLeft, describeWarmUpDay } from './warmUpLabels'
import { VIEW_LABELS, type ModeView } from './view'

/**
 * How the modes read on screen: the line each one is summed up in, what it does
 * at length on its own page, and how its state is said.
 *
 * The modes are the two parts of the app that are turned on and off rather than
 * used — Procrastination and the warm-up. Both change how the rest of the app
 * behaves for a while, which is exactly what is hard to guess from a switch, so
 * each says what it does in its own words (MODE-5).
 */

/** What a mode is for, in the one line its row on the Modes page has (MODE-2). */
export const MODE_SUMMARY: Record<ModeView, string> = {
  'modes/procrastination': 'One task out of Today, and everything else dimmed until it is done.',
  'modes/warm-up': 'One more habit allowed each day: one on day one, thirty on day thirty.',
}

/**
 * What a mode does, on its own page (MODE-5). Plain sentences, one thing each,
 * naming the controls they mean in quotes: this is the page that has to be
 * understood before the switch is touched, so it says things outright rather
 * than hinting at them, and stops well short of a wall of prose.
 */
export const MODE_POINTS: Record<ModeView, readonly string[]> = {
  'modes/procrastination': [
    'Picks one open task from Today for you to do — the easiest win it can find.',
    'Dims everything else — the other tasks, the menu, the progress bars — so nothing distracts you. Nothing is hidden or deleted.',
    'Press "Other task" to pick a different one. When one task is left, it offers to create a new one instead.',
    'Finish the task to win: add a point for the work, take another task straight away, or rest.',
    'Press "Rest" to stay in the mode with no task in front of you. Pick another one whenever you want.',
    'Press "P" on Today to turn this mode on and off from the keyboard.',
    'Stays on wherever you are signed in, until you turn it off or midnight ends it.',
  ],
  'modes/warm-up': [
    'Allows one more habit each day: 1 habit on day one, 2 on day two, up to 30 on day thirty.',
    'Holds back new habits only. Ordinary tasks are never limited, however many you have.',
    'Counts all the habits you have, not only the ones added since it started.',
    'Explains why a habit is held back, and never deletes or changes the habits you already have.',
    'Shows the day, the allowance and the way out at the top of the Habits page.',
    'Ends by itself after 30 days. Turn the switch off to end it sooner.',
  ],
}

/** The tooltip on a mode's row: that there is more to read behind it (MODE-4). */
export function describeModeHint(view: ModeView): string {
  return `Open ${VIEW_LABELS[view]} for what it does`
}

/** Where Procrastination mode stands, for its row and the head of its page (MODE-3). */
export function describeProcrastinationStatus(phase: 'off' | 'idle' | 'focus' | 'won', available: boolean): string {
  switch (phase) {
    case 'focus':
      return 'On · one task in front of you'
    case 'won':
      return 'On · a win to enjoy'
    case 'idle':
      return 'On · resting'
    default:
      return available ? 'Off' : `Off · ${NOTHING_TO_FOCUS_ON}`
  }
}

/** Why Procrastination mode cannot be turned on just now (JUST-2). */
export const NOTHING_TO_FOCUS_ON = 'nothing to do in Today'

/**
 * Where a mode stands while its data is still on its way, and why it cannot be
 * switched yet (MODE-8). `Off` would be a lie — and worse than a lie on the
 * warm-up, whose switch would start a fresh month over the one already running.
 */
export const MODE_LOADING = 'Loading…'
export const MODE_NOT_LOADED = 'Still loading.'

/** Where the warm-up stands: how far through its month it is, or that there is none (MODE-3). */
export function describeWarmUpStatus(progress: WarmUpProgress | null): string {
  if (progress === null) return 'Off'
  return `On · ${describeWarmUpDay(progress)} · ${describeDaysLeft(progress)}`
}

import {
  XP_ADD,
  XP_ADDS_A_DAY,
  XP_CHECKLIST_MAX,
  XP_CLEAR,
  XP_DONE,
  XP_FIRST_STEP,
  XP_GOAL_MAX,
  XP_GOAL_MINUTES,
  XP_GROWTH,
  XP_IDLE,
  XP_JOURNAL,
  XP_JOURNAL_FULL,
  XP_MISS_FACTOR,
  XP_OVERDUE,
  XP_OVERDUE_A_DAY,
  XP_TIME_MINUTES,
  type LevelStanding,
  type LocalDay,
} from '../core'
import { describeDueDate } from './dueLabels'
import { describeAmount } from './rewardLabels'

/**
 * How XP and the level read on screen (LVL). The rules live in ../core/xp;
 * wording is presentation, so it stays here. Every amount said here is read off
 * the rules' own numbers, so the explanation cannot drift from what is counted.
 */

export const LEVEL_HEADING = 'Level'

/** What the **i** beside the heading opens on (UI-73). */
export const XP_RULES_HEADING = 'How XP works'

/** What the page says in place of the level when the ledger could not be loaded (STORE-13). */
export const XP_NOT_LOADED = 'Couldn’t load your XP. Reload to try again.'

/** `+5`, `−3` — a minus sign rather than a hyphen — and `0`. */
export function describeXp(xp: number): string {
  if (xp > 0) return `+${describeAmount(xp)}`
  if (xp < 0) return `−${describeAmount(-xp)}`
  return '0'
}

/** `5 XP`, `1 234 XP`, `−40 XP`. */
export function describeXpAmount(xp: number): string {
  return xp < 0 ? `−${describeAmount(-xp)} XP` : `${describeAmount(xp)} XP`
}

/** How far into the level, as the bar's caption: `340 / 1 772 XP to level 8`. */
export function describeLevelProgress({ level, into, step }: LevelStanding): string {
  return `${describeAmount(into)} / ${describeAmount(step)} XP to level ${String(level + 1)}`
}

/** `Level 7`. */
export function describeLevel(level: number): string {
  return `${LEVEL_HEADING} ${String(level)}`
}

/** What the toast says when the level changes while the app is open (LVL-11). */
export function describeLevelChange(from: number, to: number): string {
  return to > from ? `Level up! You reached level ${String(to)}.` : `Down to level ${String(to)}. Lost XP took it back.`
}

/** The day XP began, as the explanation says it: `XP counts from Oct 13, the day levels began.` */
export function describeXpBegan(day: LocalDay, now: Date): string {
  const when = describeDueDate(day, now)
  const said = when === 'Today' || when === 'Yesterday' ? when.toLowerCase() : when
  return `XP counts from ${said}, the day levels began.`
}

/** One line of the table of what gives and takes XP: what is done, and what it is worth. */
export interface XpRule {
  readonly what: string
  readonly xp: string
}

/** What gives XP (LVL-4 to LVL-9), in the order things are usually done. */
export const XP_GAINS: readonly XpRule[] = [
  { what: `Add a task (the first ${String(XP_ADDS_A_DAY)} a day count)`, xp: describeXp(XP_ADD) },
  { what: 'Finish a task, or a habit’s day', xp: describeXp(XP_DONE) },
  {
    what: `… and for every ${String(XP_GOAL_MINUTES)} minutes of its time goal (up to ${describeXp(XP_GOAL_MAX)})`,
    xp: describeXp(1),
  },
  { what: `… and for every item on its checklist (up to ${describeXp(XP_CHECKLIST_MAX)})`, xp: describeXp(1) },
  { what: 'Earn points: a task’s reward, a bonus or a case', xp: `${describeXp(1)} a point` },
  { what: 'Clear everything in Today', xp: describeXp(XP_CLEAR.today) },
  { what: 'Clear everything this week', xp: describeXp(XP_CLEAR.week) },
  { what: 'Clear everything this month', xp: describeXp(XP_CLEAR.month) },
  {
    what: 'Log time on a task, to a Balance category, or in the Activity log',
    xp: `${describeXp(1)} per ${String(XP_TIME_MINUTES)} min`,
  },
  { what: 'Write anything in the journal', xp: `${describeXp(XP_JOURNAL)} a day` },
  { what: 'Fill every journal section with 5 lines', xp: `${describeXp(XP_JOURNAL_FULL)} more` },
]

/** What takes XP away (LVL-12 to LVL-14). */
export const XP_LOSSES: readonly XpRule[] = [
  { what: 'Skip a habit’s day', xp: '− its worth' },
  { what: 'Miss a habit’s day (not done, not skipped)', xp: `− ${String(XP_MISS_FACTOR)}× its worth` },
  { what: 'A day ends with no task finished', xp: describeXp(-XP_IDLE) },
  {
    what: `A task is still overdue when a day ends (at most ${describeXp(-XP_OVERDUE_A_DAY)} a day)`,
    xp: `${describeXp(-XP_OVERDUE)} each`,
  },
  { what: 'Take back anything above: untick it, delete it, or shorten the time', xp: 'what it gave' },
]

/** What the table leaves to be said, in plain sentences under it. */
export const XP_NOTES: readonly string[] = [
  `A habit’s worth is what doing it gives: ${String(XP_DONE)}, more for its time goal and checklist, and 1 for each of its points. A 1-point habit with no goal is worth ${String(XP_DONE + 1)}.`,
  'Spending points on prizes never costs XP.',
  `Everyone starts at level 0. Level 1 takes ${String(XP_FIRST_STEP)} XP, each level after takes ${String(Math.round((XP_GROWTH - 1) * 100))}% more than the one before, and there is no top level.`,
  'Lose XP and your level can drop too.',
]

import { CHEST_QUARTERS, type ChestBlock, type ChestQuarter } from '../core'

/**
 * How the chest reads on screen. The rules live in ../core/chest; wording is
 * presentation, so it stays here.
 *
 * Said in plain sentences naming the controls they mean, as a mode's page says
 * what it does (MODE-5): a chest that refuses has to say why in words, a track
 * and a knob saying nothing to anyone who does not already know.
 */

export const CHEST_NAME = 'Chest'

/** The one line the page is summed up in, under its name. */
export const CHEST_SUMMARY =
  'Clear everything in Today and a key is yours: one chest a day, for anything from 1 point to everything you earned today.'

/**
 * What an opening came to, against what it could have, for a screen reader:
 * the card's colour says it to everyone else (CHST-15).
 */
export function describeOutOf(points: number, jackpot: number): string {
  return `${String(points)} of a possible ${String(jackpot)}`
}

/**
 * Why the chest has nothing to give, said where the crate is pressed. A refusal
 * has to say what would change it, so the sentence names the thing to do rather
 * than only the thing that is wrong.
 */
export function describeChestBlock(block: ChestBlock, done: number, needed: number): string {
  switch (block) {
    case 'unclear':
      return 'Finish everything in Today to earn a key.'
    case 'tooSmall':
      return `Today asked for ${describeTasks(done)}; a key needs ${String(needed)}.`
    case 'opened':
      return 'Today’s chest is open. Come back tomorrow.'
  }
}

/** `1 task`, `3 tasks`. */
export function describeTasks(tasks: number): string {
  return `${String(tasks)} ${tasks === 1 ? 'task' : 'tasks'}`
}

/** The two ends of what a chest can give, as the page heads them (CHST-26). */
export const RANGE_LEAST = 'At least'
export const RANGE_MOST = 'Up to'

/**
 * What the most is, in a sentence under the two. Kept to one line. Practice has
 * none: its most is the number typed just below.
 */
export const RANGE_MOST_HINT = 'The most is everything you earned today.'

/**
 * Said in place of the hint while nothing finished today has earned anything,
 * which leaves the most no more than the least. Said as what to do about it,
 * since that is what the reader can use.
 */
export const RANGE_NOTHING_YET = 'Nothing finished today has earned points yet. Give a task a reward with its star.'

/** `1 to 25 points`, or `1 point` where the two ends meet. */
export function describeChestRange(least: number, most: number): string {
  return least === most ? `${String(most)} ${most === 1 ? 'point' : 'points'}` : `${String(least)} to ${String(most)} points`
}

/** What the line under the crate says while a key is waiting. */
export const CHEST_READY = 'Press to open'

/** What it says once today's is open and this device saw it. */
export function describeOpened(points: number): string {
  return `Today’s chest gave ${describeChestPoints(points)}.`
}

/** `+12`, as the ledger spells an earning out. */
export function describeChestPoints(points: number): string {
  return `+${String(points)}`
}

/** The line above the setting for how big a day has to be. */
export const LEAST_TASKS_LABEL = 'Tasks a day must ask for'

export const LEAST_TASKS_HINT =
  'A cleared day earns no key unless it asked for at least this many tasks, so one thing remembered at bedtime is not a day’s work.'

/** What the key plays for, said on Rules where the old choice of it was (CHST-7). */
export const JACKPOT_LABEL = 'What the key plays for'

export const JACKPOT_HINT =
  'Anything from 1 point to everything you earned today, every amount as likely as any other.'

/** `Today the most is 37 points.` */
export function describeJackpotToday(points: string): string {
  return `Today the most is ${points}.`
}

/** What the notice says the moment the day comes clear (CHST-23). */
export const CHEST_NOTICE = 'Today is clear. A key is waiting.'

export const CHEST_NOTICE_ACTION = 'Open the chest'

/** How the sound toggle reads, which says what it will do rather than what it is. */
export function describeSound(on: boolean): string {
  return on ? 'Turn the sound off' : 'Turn the sound on'
}

/** The practice switch, and what it changes. */
export const PRACTICE_LABEL = 'Practice'

export const PRACTICE_HINT =
  'Open the chest as often as you like to see how it goes. Nothing is earned and nothing is saved while this is on.'

export const PRACTICE_BAND = 'Practice — nothing is earned'

export const PRACTICE_SKIP_LABEL = 'Skip the wait'

/** What each quarter of the jackpot is called in the practice tally. */
export const QUARTER_NAMES: Record<ChestQuarter, string> = {
  1: 'Up to ¼',
  2: 'Up to ½',
  3: 'Up to ¾',
  4: 'Over ¾',
}

/** The tally of a practice run, so the odds can be eyed: every quarter should come up about as often. */
export function describeTally(counts: Readonly<Record<ChestQuarter, number>>, points: number): string {
  const opens = CHEST_QUARTERS.reduce((sum, quarter) => sum + counts[quarter], 0)
  if (opens === 0) return 'No practice openings yet.'

  const average = Math.round((points / opens) * 10) / 10
  return `${String(opens)} openings, ${String(average)} points each on average.`
}

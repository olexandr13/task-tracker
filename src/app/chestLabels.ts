import { CHEST_TIERS, type ChestBlock, type ChestJackpot, type ChestTier } from '../core'

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
export const CHEST_SUMMARY = 'Clear everything in Today and a key is yours: one chest a day, for a share of the jackpot.'

/** What each tier is called once the lid is open. */
export const TIER_NAMES: Record<ChestTier, string> = {
  pinch: 'A pinch',
  handful: 'A handful',
  haul: 'A haul',
  jackpot: 'JACKPOT',
}

/** What each tier is worth saying about it, beside the number. */
export const TIER_NOTES: Record<ChestTier, string> = {
  pinch: 'Not much, but a chest is never empty.',
  handful: 'A fair share of the jackpot.',
  haul: 'Most of the jackpot — a good day to have cleared.',
  jackpot: 'The whole jackpot. Four openings in a hundred go like that.',
}

/**
 * Why the chest has nothing to give, said where the lid is pressed. A refusal
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

/** What the most is, in a sentence under the two, by how it is worked out. Kept to one line. */
export const RANGE_MOST_HINTS: Record<ChestJackpot | 'practice', string> = {
  bestTask: 'The most is what your best task today was worth.',
  typicalDay: 'The most is what a typical day earned this week.',
  practice: 'The most is what you are practising with.',
}

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

/** What the lid says while a key is waiting. */
export const CHEST_READY = 'Press to open'

/** What it says once today's is open and this device saw it. */
export function describeOpened(points: number): string {
  return `Today’s chest gave ${describeChestPoints(points)}.`
}

/** `+12`, as the ledger spells an earning out. */
export function describeChestPoints(points: number): string {
  return `+${String(points)}`
}

/** What each way of working the jackpot out is called where it is chosen. */
export const JACKPOT_LABELS: Record<ChestJackpot, string> = {
  bestTask: 'Today’s best task',
  typicalDay: 'A typical day',
}

/** What each one means, in a sentence under its name. */
export const JACKPOT_HINTS: Record<ChestJackpot, string> = {
  bestTask: 'The most any one task earned today, so a day of heavy work plays for a bigger prize.',
  typicalDay: 'The average earned a day over the last seven days, which moves more slowly than one day can.',
}

/** The line above the setting for how big a day has to be. */
export const LEAST_TASKS_LABEL = 'Tasks a day must ask for'

export const LEAST_TASKS_HINT =
  'A cleared day earns no key unless it asked for at least this many tasks, so one thing remembered at bedtime is not a day’s work.'

/** The line above the jackpot setting. */
export const JACKPOT_LABEL = 'What the key plays for'

export const JACKPOT_HINT = 'The most a chest can give. Every opening pays a share of it, and four in a hundred pay the whole.'

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

/** The tally of a practice run, so the odds can be eyed against the table. */
export function describeTally(counts: Readonly<Record<ChestTier, number>>, points: number): string {
  const opens = CHEST_TIERS.reduce((sum, tier) => sum + counts[tier], 0)
  if (opens === 0) return 'No practice openings yet.'

  const average = Math.round((points / opens) * 10) / 10
  return `${String(opens)} openings, ${String(average)} points each on average.`
}

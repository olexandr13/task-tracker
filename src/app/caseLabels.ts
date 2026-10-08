import {
  CASE_QUARTERS,
  type CaseSource,
  type CaseBlock,
  type CaseOdds,
  type CaseQuarter,
  type CaseSpan,
} from '../core'

/**
 * How Cases reads on screen. The rules live in ../core/cases; wording is
 * presentation, so it stays here.
 *
 * Said in plain sentences naming the controls they mean, as a mode's page says
 * what it does (MODE-5): a case that refuses has to say why in words, a track
 * and a knob saying nothing to anyone who does not already know.
 */

export const CASES_NAME = 'Cases'

/** What the sheet behind the i on Cases is headed (CHST-22). */
export const CASES_RULES_HEADING = 'How much each case pays'

/** The labels beside the least and the most a case pays, on that sheet. */
export const CASES_RULE_MIN = 'Min'
export const CASES_RULE_MAX = 'Max'

/**
 * How each case is worked out, behind the i on Cases (CHST-22, UI-73): the
 * least and the most it pays, in general. How a case is earned is said under a
 * case still on its way, so it is not said again here. Where tasks without
 * points are not counted (CHST-32), the rule says so rather than promising them.
 */
export function describeCasesRules(countUnpaid: boolean): readonly {
  readonly source: CaseSource
  readonly min: string
  readonly max: string
}[] {
  return [
    {
      source: 'today',
      min: 'Cheapest task finished today',
      max: countUnpaid ? 'Half of points earned today + number of unrewarded tasks done' : 'Half of points earned today',
    },
    {
      source: 'daily',
      min: '0',
      max: `Yesterday’s average task value + number of ${countedTasks(countUnpaid)} done`,
    },
    {
      source: 'week',
      min: 'Cheapest task finished last week',
      max: `Last week’s average task value + number of ${countedTasks(countUnpaid)} done`,
    },
  ]
}

/** Which tasks the Drop and Weekly add one for: all of them, or those with points (CHST-32). */
function countedTasks(countUnpaid: boolean): string {
  return countUnpaid ? 'tasks' : 'rewarded tasks'
}

/**
 * What an opening came to, against what it could have, for a screen reader:
 * the card's colour says it to everyone else (CHST-15).
 */
export function describeOutOf(points: number, jackpot: number): string {
  return `${String(points)} of a possible ${String(jackpot)}`
}

/**
 * Why Cases has nothing to give, said where the crate is pressed. An
 * unfinished Today says nothing. Any other refusal names what would change it.
 */
export function describeCaseBlock(block: CaseBlock, done: number, needed: number): string {
  switch (block) {
    case 'unclear':
      return ''
    case 'tooSmall':
      return `Today asked for ${describeTasks(done)}; a case needs ${String(needed)}.`
    case 'opened':
      return 'Payday and the Drop are open. Come back tomorrow.'
    case 'bonusWaiting':
      return 'The Drop is on its way. The timer shows when it arrives.'
  }
}

/** `1 task`, `3 tasks`. */
export function describeTasks(tasks: number): string {
  return `${String(tasks)} ${tasks === 1 ? 'task' : 'tasks'}`
}

/** What the page heads the range a case can give with (CHST-26). */
export const RANGE_LABEL = 'Possible win'

/** The ways a case arrives, as the card names them. */
export const SOURCE_LABEL: Record<CaseSource, string> = {
  today: 'Payday',
  daily: 'Drop',
  week: 'Weekly',
}

/** What a ready case's button is called: pressing it opens that case (CHST-13). */
export function describeOpenCase(source: CaseSource): string {
  return `Open the ${SOURCE_LABEL[source]} case`
}

/** What a case still on its way says, in place of a possible win. */
export const SOURCE_WAITING: Record<CaseSource, string> = {
  today:
    'Finish everything in Today to get this case. Reward depends on number of points earned today.',
  daily:
    'Arrives once a day, at a random time. Reward depends on number of points earned yesterday.',
  week:
    'Appears weekly on Monday. Reward depends on number of points earned last week.',
}

/**
 * What the countdown on a case still on its way is called (CHST-29, CHST-30).
 * Payday has none: it is earned, not waited for.
 */
export const TIMER_LABEL: Record<Exclude<CaseSource, 'today'>, string> = {
  daily: 'Time until the Drop',
  week: 'Time until Weekly',
}

/**
 * What follows the number on a planned Payday, which says how many tasks are
 * still between it and being ready (CHST-31): `3` `tasks left`, `1` `task left`.
 */
export function describeTasksLeftUnit(tasks: number): string {
  return tasks === 1 ? 'task left' : 'tasks left'
}

/** The tag on the crate of a case the day has already had (CHST-28). */
export const OPENED_TAG = 'Opened'

/**
 * What an opened case says about the next one of its kind, until the day ends
 * (CHST-28, CHST-30). Payday comes back tomorrow once every planned task is
 * done. The Drop says a new case is given tomorrow, and not when, and that
 * earning more today raises what that next case pays. Weekly says a new
 * one is given next Monday.
 */
export function describeNextCase(source: CaseSource): string {
  if (source === 'today') return 'Take the next one tomorrow after completing all planned tasks.'
  if (source === 'week') return 'A new case will be given next Monday.'
  return 'A new case will be given tomorrow. Earn more points today to increase reward.'
}

/**
 * The line under a ready case (CHST-10). For Payday and Weekly the number in
 * front of it is what that rule comes to today; this line says where the number
 * comes from, and names only the tasks that are counted (CHST-32). The Drop
 * says instead that what today earns raises tomorrow's.
 */
export function describeSourceRule(source: CaseSource, countUnpaid: boolean): string {
  const withPoints = countUnpaid ? '' : ' with points'
  switch (source) {
    case 'today':
      return countUnpaid
        ? 'From the cheapest task today, up to half of today’s rewards plus today’s tasks without points.'
        : 'From the cheapest task today, up to half of today’s rewards.'
    case 'daily':
      return 'Earn more points today to get a bigger reward tomorrow.'
    case 'week':
      return `From the cheapest task last week, up to last week’s average task plus last week’s tasks${withPoints}.`
  }
}

/** What the group of cases is called, for someone who cannot see the row. */
export const CASES_LABEL = 'Cases'

/**
 * The number in front of a case: `13`, `1–25`, or `1 or 25`. The unit follows
 * it, so a single point can be spelled *point*.
 */
export function describeCaseWin(odds: CaseOdds): string {
  if (odds.shape === 'either') return `${String(odds.least)} or ${String(odds.most)}`
  return odds.least === odds.most ? String(odds.most) : `${String(odds.least)}–${String(odds.most)}`
}

/** `point` where a case can only give 1, `points` otherwise. */
export function describeCaseUnit(odds: CaseOdds): string {
  return odds.least === 1 && odds.most === 1 ? 'point' : 'points'
}

/** `1 to 25 points`, or `1 point` where the two ends meet. */
export function describeCaseRange(least: number, most: number): string {
  return least === most ? `${String(most)} ${most === 1 ? 'point' : 'points'}` : `${String(least)} to ${String(most)} points`
}

/**
 * How Cases stands on Rewards: what each case can pay, as the ledger stands.
 * Weekly’s range is said only on Monday, when that case is ready or already
 * open. While it is only planned, it has no possible win (CHST-26, CHST-30).
 */
export function describeCasesOffer(today: CaseSpan, daily: CaseSpan, share: CaseSpan | null = null): string {
  const lines = [
    `Payday pays ${describeCaseRange(today.least, today.most)}.`,
    `The Drop pays ${describeCaseRange(daily.least, daily.most)}.`,
  ]
  if (share !== null) lines.push(`Weekly pays ${describeCaseRange(share.least, share.most)}.`)
  return lines.join(' ')
}

/** What the line under the crate says while a key is waiting. */
export const CASE_READY = 'Press to open'

/** What it says once Payday is open and this device saw it. */
export function describeOpened(points: number): string {
  return `Payday gave ${describeCasePoints(points)}.`
}

/** `+12`, as the ledger spells an earning out, and `0` for nothing: nothing gained has no sign. */
export function describeCasePoints(points: number): string {
  return points === 0 ? '0' : `+${String(points)}`
}

/** What heads the list of what today's cases gave, on Cases (CHST-33). */
export const OPENED_TODAY_LABEL = 'Opened today'

/** `point` or `points`, after the number a case gave, for someone who cannot see that it is points. */
export function describePointsUnit(points: number): string {
  return points === 1 ? 'point' : 'points'
}

/** The line above the setting for how big a day has to be. */
export const LEAST_TASKS_LABEL = 'Tasks a day must ask for'

export const LEAST_TASKS_HINT =
  'A cleared day earns no case unless it asked for at least this many tasks, so one thing remembered at bedtime is not a day’s work.'

/** What the cases pay, said on Rules (CHST-10). */
export const JACKPOT_LABEL = 'What the cases pay'

/** How the cases are worked out, said on Rules, naming only the tasks that are counted (CHST-32). */
export function describeJackpotHint(countUnpaid: boolean): string {
  const withPoints = countUnpaid ? '' : ' with points'
  return [
    countUnpaid
      ? 'Payday pays from the cheapest task finished today up to half of everything earned today, plus 1 for each task finished today without points.'
      : 'Payday pays from the cheapest task finished today up to half of everything earned today.',
    `The Drop pays from 0 points up to the average points of yesterday’s tasks, plus 1 for each task finished yesterday${withPoints}.`,
    `Weekly pays from the cheapest task finished last week up to the average points of last week’s tasks, plus 1 for each task finished last week${withPoints}.`,
  ].join(' ')
}

/** `Earned today: 37 points.` */
export function describeJackpotToday(points: string): string {
  return `Earned today: ${points}.`
}

/** What the notice says the moment the day comes clear (CHST-23). */
export const CASE_NOTICE = 'Today is clear. Payday is waiting.'

/** What the notice says the moment the Drop's timer runs out (CHST-29). */
export const CASE_DAILY_NOTICE = 'The Drop is here.'

/** What the notice says on Monday, while Weekly is still to open (CHST-30). */
export const CASE_SHARE_NOTICE = 'Weekly is here.'

/** The line under the Drop's notice, on the browser notification. */
export const CASE_DAILY_NOTICE_BODY = 'Open it in Cases.'

export const CASE_NOTICE_ACTION = 'Open Cases'

/** How the sound toggle reads, which says what it will do rather than what it is. */
export function describeSound(on: boolean): string {
  return on ? 'Turn the sound off' : 'Turn the sound on'
}

/** The switch on Settings for counting tasks without points, and what it changes (CHST-32). */
export const COUNT_UNPAID_LABEL = 'Count unrewarded tasks'

/** The line under the switch. */
export const COUNT_UNPAID_DESCRIPTION = 'Each task done without points adds 1 to the most a case can pay.'

/** The practice switch on Settings, and what it changes (CHST-21). */
export const PRACTICE_LABEL = 'Practice mode'

/** The line under the switch. */
export const PRACTICE_DESCRIPTION = 'Open Cases as often as you like. Nothing is earned.'

/** What Cases' page says while practice is on, beside the way to turn it off there. */
export const PRACTICE_ON = 'Practice mode is on, from Settings. Nothing you open here is earned.'

export const PRACTICE_OFF_LABEL = 'Turn practice off'

export const PRACTICE_BAND = 'Practice — nothing is earned'

export const PRACTICE_SKIP_LABEL = 'Skip the wait'

/** What heads the jackpot typed in for practice (CHST-21). */
export const PRACTICE_JACKPOT_LABEL = 'Up to'

/** What each quarter of the jackpot is called in the practice tally. */
export const QUARTER_NAMES: Record<CaseQuarter, string> = {
  1: 'Up to ¼',
  2: 'Up to ½',
  3: 'Up to ¾',
  4: 'Over ¾',
}

/** The tally of a practice run, so the odds can be eyed: every quarter should come up about as often. */
export function describeTally(counts: Readonly<Record<CaseQuarter, number>>, points: number): string {
  const opens = CASE_QUARTERS.reduce((sum, quarter) => sum + counts[quarter], 0)
  if (opens === 0) return 'No practice openings yet.'

  const average = Math.round((points / opens) * 10) / 10
  return `${String(opens)} openings, ${String(average)} points each on average.`
}

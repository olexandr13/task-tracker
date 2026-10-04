import {
  CASE_QUARTERS,
  type CaseSource,
  type CaseBlock,
  type CaseOdds,
  type CaseQuarter,
  type CaseSpan,
  type CaseWorking,
  type DailyWorking,
  type TodayWorking,
  type WeekWorking,
} from '../core'
import { describePoints } from './rewardLabels'

/**
 * How Cases reads on screen. The rules live in ../core/cases; wording is
 * presentation, so it stays here.
 *
 * Said in plain sentences naming the controls they mean, as a mode's page says
 * what it does (MODE-5): a case that refuses has to say why in words, a track
 * and a knob saying nothing to anyone who does not already know.
 */

export const CASES_NAME = 'Cases'

/**
 * The rules behind the i on Cases (CHST-22, UI-73). One case a block.
 * Where the reward depends on a day, on yesterday, or on last week, the rule
 * says exactly how. The working for that rule, as the ledger stands, is
 * `describeCaseWorking`.
 */
export const CASES_RULES: readonly {
  readonly source: CaseSource
  readonly name: string
  readonly lines: readonly string[]
}[] = [
  {
    source: 'today',
    name: 'Payday',
    lines: [
      'Finish everything in Today and this case is yours.',
      'The reward depends on what you finish today: from the cheapest task finished today, up to half of everything earned today.',
    ],
  },
  {
    source: 'daily',
    name: 'Drop',
    lines: [
      'Arrives once a day, at a random time.',
      'The reward depends on yesterday: from 1 point, up to everything earned yesterday divided by how many tasks that was.',
    ],
  },
  {
    source: 'week',
    name: 'Weekly',
    lines: [
      'Appears on Monday.',
      'The reward depends on last week: from the cheapest task finished last week, up to everything earned last week divided by how many tasks that was.',
    ],
  },
]

/**
 * How this case’s range stands just now, in one sentence of the working and
 * one of what it pays (CHST-22). The short rule under the case says where the
 * number comes from; this is that sum, from the ledger.
 */
export function describeCaseWorking(working: CaseWorking): string {
  switch (working.source) {
    case 'today':
      return describeTodayWorking(working)
    case 'daily':
      return describeDailyWorking(working)
    case 'week':
      return describeWeekWorking(working)
  }
}

function describeTodayWorking(working: TodayWorking): string {
  const pays = `Payday pays ${describeCaseRange(working.span.least, working.span.most)}.`
  if (working.cheapest === null && working.earned === 0) {
    return `No task has been finished today, and nothing has been earned yet. ${pays}`
  }

  const cheapest =
    working.cheapest === null
      ? 'No task has been finished today.'
      : `The cheapest task finished today is ${describePoints(working.cheapest)}.`
  const half =
    working.cheapest !== null && working.half < working.cheapest
      ? `${describePoints(working.half)}, which is less than that task`
      : describePoints(working.half)

  return `${cheapest} Everything earned today is ${describePoints(working.earned)}, so half is ${half}. ${pays}`
}

function describeDailyWorking(working: DailyWorking): string {
  const pays = `The Drop pays ${describeCaseRange(working.span.least, working.span.most)}.`
  if (working.tasks === 0) return `Yesterday had no tasks. ${pays}`

  return `Yesterday earned ${describePoints(working.earned)} across ${describeTasks(working.tasks)}, which comes to ${describePoints(working.share)}. ${pays}`
}

function describeWeekWorking(working: WeekWorking): string {
  const pays = `Weekly pays ${describeCaseRange(working.span.least, working.span.most)}.`
  if (working.cheapest === null) return `Last week had no tasks. ${pays}`

  const share =
    working.share < working.cheapest
      ? `${describePoints(working.share)}, which is less than that task`
      : describePoints(working.share)

  return `The cheapest task finished last week is ${describePoints(working.cheapest)}. Last week earned ${describePoints(working.earned)} across ${describeTasks(working.tasks)}, which comes to ${share}. ${pays}`
}

/** Every amount inside a case’s own range is drawn the same way (CHST-10). */
export const CASES_ODDS = 'Each amount in a case’s range is as likely as any other.'

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
    'Finish everything in Today and a case is yours. Reward depends on the cheapest task today, up to half of today’s rewards.',
  daily:
    'Arrives once a day, at a random time. Reward depends on yesterday: from 1 point, up to yesterday’s rewards divided by yesterday’s tasks.',
  week:
    'Arrives on Monday. Reward depends on last week: from the cheapest task last week, up to last week’s rewards divided by last week’s tasks.',
}

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
 * The rule under a ready case (CHST-10). The number in front of it is what
 * that rule comes to today; this line says where the number comes from.
 */
export const SOURCE_RULE: Record<CaseSource, string> = {
  today: 'From the cheapest task today, up to half of today’s rewards.',
  daily: 'From 1 point, up to yesterday’s rewards divided by yesterday’s tasks.',
  week: 'From the cheapest task last week, up to last week’s rewards divided by last week’s tasks.',
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

/** `+12`, as the ledger spells an earning out. */
export function describeCasePoints(points: number): string {
  return `+${String(points)}`
}

/** The line above the setting for how big a day has to be. */
export const LEAST_TASKS_LABEL = 'Tasks a day must ask for'

export const LEAST_TASKS_HINT =
  'A cleared day earns no case unless it asked for at least this many tasks, so one thing remembered at bedtime is not a day’s work.'

/** What the cases pay, said on Rules (CHST-10). */
export const JACKPOT_LABEL = 'What the cases pay'

export const JACKPOT_HINT =
  'Payday pays from the cheapest task finished today up to half of everything earned today. The Drop pays from 1 point up to everything earned yesterday divided by how many tasks that was. Weekly pays from the cheapest task finished last week up to everything earned last week divided by how many tasks that was.'

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

/** What the countdown on the Drop is called. */
export const DROP_TIMER_LABEL = 'Time until the Drop'

/** The line under that, on the browser notification. */
export const CASE_DAILY_NOTICE_BODY = 'Open it in Cases.'

export const CASE_NOTICE_ACTION = 'Open Cases'

/** How the sound toggle reads, which says what it will do rather than what it is. */
export function describeSound(on: boolean): string {
  return on ? 'Turn the sound off' : 'Turn the sound on'
}

/** The practice switch on Settings, and what it changes (CHST-21). */
export const PRACTICE_LABEL = 'Practice mode'

/** The line under the switch. */
export const PRACTICE_DESCRIPTION = 'Open Cases as often as you like. Nothing is earned.'

export const PRACTICE_HINT =
  'Open Cases as often as you like to see how it goes. Nothing is earned and nothing is saved while this is on, and it is off again whenever the app is opened.'

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

import { goalPercent, isGoalReached, type GoalProgress } from '../core'

/**
 * How the goals read (GOAL-1). The rules live in ../core/goal; wording is
 * presentation, so it stays here.
 */

export const GOALS_HEADING = 'Goals'

/** What the page is for and how it is used, in plain sentences, one thing each (UI-73). */
export const GOALS_INTRO = [
  'A goal is something bigger that your tasks add up to, like "Run a half marathon".',
  'Type a name in the box and press "Add" to make one. The goal opens, so you can add its tasks right away.',
  'To link a task you already have, right-click it and choose the goal, or open the task and press the target button.',
  'A task counts towards one goal at a time.',
  'The bar shows how many of the goal’s tasks are done. A repeating task counts as done once today’s is done.',
  'Press the pencil to rename a goal and "×" to delete it. Its tasks stay; they just stop counting towards it.',
] as const

export const GOAL_NAME_TAKEN = 'There is a goal called that already.'

export const NO_GOALS = 'No goals yet. Name one above, then link the tasks that move it forward.'

/** `No tasks yet`, `3 of 4 done`, `All 4 done`: the count under a goal's bar (GOAL-7, GOAL-8). */
export function describeGoalProgress(progress: GoalProgress): string {
  if (progress.total === 0) return 'No tasks yet'
  if (isGoalReached(progress)) return progress.total === 1 ? 'Its task is done' : `All ${String(progress.total)} done`
  return `${String(progress.done)} of ${String(progress.total)} done`
}

/** `75%`, or a dash for a goal no task serves yet, which is no share of anything (GOAL-8). */
export function describeGoalPercent(progress: GoalProgress): string {
  const percent = goalPercent(progress)
  return percent === null ? '—' : `${String(percent)}%`
}

/**
 * A goal on the Goals page as a screen reader hears its button, the bar inside
 * it being drawn rather than heard there: `Get fit: 3 of 4 done, 75%`.
 */
export function describeGoalButton(name: string, progress: GoalProgress): string {
  const caption = describeGoalProgress(progress)
  return progress.total === 0 ? `${name}: ${caption.toLowerCase()}` : `${name}: ${caption}, ${describeGoalPercent(progress)}`
}

/** The deletion asked about in the app's own sheet (GOAL-17, UI-74). */
export function askDeleteGoal(name: string) {
  return {
    question: `Delete the goal "${name}"?`,
    lines: ['Its tasks stop counting towards it.', 'The tasks themselves are not deleted.'],
    confirm: 'Delete',
  }
}

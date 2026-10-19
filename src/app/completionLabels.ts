import { offsetDay, toLocalDay, type CompletionSpan, type LocalDay } from '../core'
import { describeShortDate } from './dueLabels'

/**
 * What heads each span of done tasks. The spans themselves live in ../core;
 * wording is presentation, so it stays here.
 */
export const COMPLETION_SPAN_LABELS: Record<CompletionSpan, string> = {
  today: 'Done today',
  yesterday: 'Done yesterday',
  last7Days: 'Done in the last 7 days',
  last30Days: 'Done in the last 30 days',
  earlier: 'Done earlier',
}

/**
 * What heads one undivided run of done tasks, where the view keeps them
 * together instead of dividing them by when they were finished.
 */
export const DONE_LABEL = 'Done'

/**
 * What a row standing for a day a repeating task was done on before says
 * (TASK-75): the day beside the title — *Yesterday*, or a short date — and,
 * for a screen reader, which task, which day, and where a tap on it goes.
 */
export function describePastCompletion(title: string, day: LocalDay, now: Date): { day: string; label: string } {
  const today = toLocalDay(now)
  const when =
    day === today ? 'today' : day === offsetDay(today, -1) ? 'yesterday' : `on ${describeShortDate(day, now)}`
  return {
    day: when === 'today' ? 'Today' : when === 'yesterday' ? 'Yesterday' : describeShortDate(day, now),
    label: `"${title}", done ${when}. Open the task`,
  }
}

/** What an opened span says while the tasks finished in it are on their way (TASK-74). */
export const SPAN_LOADING = 'Loading…'

/** What an opened span says when, loaded, it turns out to hold nothing (TASK-74). */
export const SPAN_EMPTY = 'Nothing was finished in this time.'

/**
 * What a box says when it will not tick a task with an open checklist item on
 * it (CHK-11). Short, because it is read mid-click: the parts are what the box
 * is waiting on, and the checklist is already on screen beside the words.
 */
export const OPEN_SUBTASKS_REFUSAL = 'Complete subtasks first'

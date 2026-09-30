import type { CompletionSpan } from '../core'

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
 * What a box says when it will not tick a task with an open checklist item on
 * it (CHK-11). Short, because it is read mid-click: the parts are what the box
 * is waiting on, and the checklist is already on screen beside the words.
 */
export const OPEN_SUBTASKS_REFUSAL = 'Complete subtasks first'

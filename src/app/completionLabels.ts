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

import { OPEN_SUBTASKS_REFUSAL } from '../completionLabels'

/**
 * The line a row, card or sheet shows when its box would not tick the task off:
 * the checklist still has a part to do (CHK-11). An alert, so it is spoken the
 * moment it appears — the click it answers has already happened, and a note
 * nobody is looking at is no answer at all.
 *
 * Amber rather than red: nothing has gone wrong, the task is simply not
 * finished yet. Where it sits is the caller's, which knows what the words
 * should line up under.
 */
export function CompletionRefusal({ className }: { className?: string }) {
  return (
    <p
      role="alert"
      className={[
        'text-xs text-amber-700 dark:text-amber-400',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {OPEN_SUBTASKS_REFUSAL}
    </p>
  )
}

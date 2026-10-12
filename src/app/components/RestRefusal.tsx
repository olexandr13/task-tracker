/**
 * The line a Skip shows when it would not pass today over: the habit has no
 * rest left to spend on it (HAB-38). An alert, so it is spoken the moment it
 * appears, as a refused tick's is (CompletionRefusal).
 *
 * Amber rather than red: nothing has gone wrong, the habit is simply to be
 * done today. Where it sits is the caller's, which knows which Skip was
 * pressed.
 */
export function RestRefusal({ note, className }: { note: string; className?: string }) {
  return (
    <p
      role="alert"
      className={['text-xs text-amber-700 dark:text-amber-400', className].filter(Boolean).join(' ')}
    >
      {note}
    </p>
  )
}

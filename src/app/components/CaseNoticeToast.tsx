import { CASE_NOTICE, CASE_NOTICE_ACTION } from '../caseLabels'
import { CasesIcon } from './CasesIcon'

/**
 * A case notice at the top of the window: the day came clear (CHST-23), or
 * the daily case's timer ran out (CHST-29). Said where it happened rather than
 * left to be found, and dismissed by going to Cases or by its ×.
 */
export function CaseNoticeToast({
  message = CASE_NOTICE,
  onOpen,
  onDismiss,
}: {
  message?: string
  onOpen: () => void
  onDismiss: () => void
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto flex max-w-full items-center gap-2 rounded-xl bg-amber-700 py-2 pr-2 pl-4 text-sm text-white shadow-xl dark:bg-amber-200 dark:text-amber-950"
    >
      <CasesIcon className="size-5 shrink-0" />
      <span className="min-w-0">{message}</span>
      <button
        type="button"
        onClick={onOpen}
        className="shrink-0 rounded-lg px-2 py-1 font-medium underline decoration-white/40 underline-offset-2 transition-colors hover:bg-white/10 dark:decoration-amber-800/40 dark:hover:bg-black/5"
      >
        {CASE_NOTICE_ACTION}
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-lg px-2 py-1 text-lg leading-none text-amber-200/80 transition-colors hover:bg-white/10 hover:text-white dark:text-amber-800 dark:hover:bg-black/5 dark:hover:text-amber-950"
      >
        ×
      </button>
    </div>
  )
}

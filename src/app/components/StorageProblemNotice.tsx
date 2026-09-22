import { STORAGE_PROBLEM_LABELS, type StorageProblem } from '../storageProblem'

/**
 * A load or a save the service refused (STORE-13). Louder than the sync badge —
 * something did not happen — and it stays until dismissed, since reloading is
 * the owner's call to make.
 */
export function StorageProblemNotice({ problem, onDismiss }: { problem: StorageProblem; onDismiss: () => void }) {
  return (
    <div
      role="alert"
      className="pointer-events-auto flex max-w-full items-center gap-2 rounded-xl bg-neutral-900 py-2 pr-2 pl-3 text-sm text-white shadow-xl dark:bg-neutral-100 dark:text-neutral-900"
    >
      <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-red-500" />
      <span className="min-w-0">{STORAGE_PROBLEM_LABELS[problem]}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-lg px-2 py-1 text-lg leading-none text-neutral-400 transition-colors hover:bg-white/10 hover:text-white dark:text-neutral-500 dark:hover:bg-black/5 dark:hover:text-neutral-900"
      >
        ×
      </button>
    </div>
  )
}

import { CHEST_NOTICE, CHEST_NOTICE_ACTION } from '../chestLabels'
import { ChestIcon } from './ChestIcon'

/**
 * Today came clear, so a key is waiting (CHST-23). Said where the day was
 * cleared rather than left to be found: a key nobody notices earns nothing, and
 * the moment the last task goes is the moment the chest is worth most.
 *
 * Said once a day on this device, which is what the device remembers (CHST-24).
 */
export function ChestNoticeToast({ onOpen, onDismiss }: { onOpen: () => void; onDismiss: () => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto flex max-w-full items-center gap-2 rounded-xl bg-amber-700 py-2 pr-2 pl-4 text-sm text-white shadow-xl dark:bg-amber-200 dark:text-amber-950"
    >
      <ChestIcon className="size-5 shrink-0" />
      <span className="min-w-0">{CHEST_NOTICE}</span>
      <button
        type="button"
        onClick={onOpen}
        className="shrink-0 rounded-lg px-2 py-1 font-medium underline decoration-white/40 underline-offset-2 transition-colors hover:bg-white/10 dark:decoration-amber-800/40 dark:hover:bg-black/5"
      >
        {CHEST_NOTICE_ACTION}
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

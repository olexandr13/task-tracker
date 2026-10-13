import { describeLevelChange } from '../levelLabels'

interface LevelToastProps {
  from: number
  to: number
  onOpen: () => void
  onDismiss: () => void
}

/**
 * The level changed while the app is open (LVL-11): up, in the colour of a win,
 * or down, plainly. **Open** goes to the Level page.
 */
export function LevelToast({ from, to, onOpen, onDismiss }: LevelToastProps) {
  const up = to > from
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-auto flex max-w-full items-center gap-2 rounded-xl py-2 pr-2 pl-4 text-sm shadow-xl ${
        up
          ? 'bg-amber-600 text-white dark:bg-amber-300 dark:text-amber-950'
          : 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
      }`}
    >
      <span className="min-w-0 truncate">{describeLevelChange(from, to)}</span>
      <button
        type="button"
        onClick={onOpen}
        className="shrink-0 rounded-lg px-2 py-1 font-medium transition-colors hover:bg-white/15 dark:hover:bg-black/10"
      >
        Open
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-lg px-2 py-1 text-lg leading-none opacity-70 transition-colors hover:bg-white/15 hover:opacity-100 dark:hover:bg-black/10"
      >
        ×
      </button>
    </div>
  )
}

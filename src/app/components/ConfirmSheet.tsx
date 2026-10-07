import { BottomSheet } from './BottomSheet'

/** A question asked before something that cannot be taken back, in the app's own words. */
export interface Confirmation {
  /** The question itself, which is also the sheet's heading: `Disable the warm-up?` */
  readonly question: string
  /** What saying yes costs, a plain sentence each. */
  readonly lines: readonly string[]
  /** The button that goes ahead: `Disable`. */
  readonly confirm: string
}

interface ConfirmSheetProps {
  confirmation: Confirmation
  onConfirm: () => void
  /** Cancel, and every other way out of the sheet: Escape, back, a tap outside. */
  onCancel: () => void
}

/** A thumb's height on a phone (UI-49), and filled, so it reads as a button where nothing hovers. */
const button =
  'h-11 flex-1 rounded-xl px-4 text-base font-medium transition-colors md:h-9 md:rounded-lg md:text-sm'
const cancel = `${button} bg-neutral-100 text-neutral-800 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700`
const danger = `${button} bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400 dark:hover:bg-red-950`

/**
 * Asks before something that cannot be taken back, in a sheet drawn by the app
 * rather than the browser's own `confirm` — which speaks in the browser's voice,
 * under the site's address, and reads as a fault rather than a question. On a
 * phone it slides up from the bottom; on a wide screen it is a dialog in the
 * middle of the window (UI-48, UI-54). Anything but the button that goes ahead
 * leaves things as they were.
 */
export function ConfirmSheet({ confirmation, onConfirm, onCancel }: ConfirmSheetProps) {
  const { question, lines, confirm } = confirmation

  return (
    <BottomSheet label={question} onClose={onCancel}>
      <div className="flex flex-col gap-5 px-4 pt-1 pb-1 md:px-5 md:pt-2">
        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-lg leading-6 text-neutral-900 dark:text-neutral-100">{question}</h2>
          {lines.map((line) => (
            <p key={line} className="text-sm text-neutral-600 dark:text-neutral-400">
              {line}
            </p>
          ))}
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className={cancel}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className={danger}>
            {confirm}
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}

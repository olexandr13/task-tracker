import { VIEW_LABELS } from '../view'
import { ChevronIcon } from './ChevronIcon'

const link =
  'flex min-h-11 items-center gap-1 self-start rounded-lg pr-3 pl-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900 active:bg-neutral-100 md:hidden dark:text-neutral-400 dark:hover:text-neutral-100 dark:active:bg-neutral-800/60 [-webkit-tap-highlight-color:transparent]'

/**
 * The way back from a mode's page to the list of the modes, on a phone (MODE-7).
 *
 * A wide screen lists the modes in the sidebar, under Modes and each a click
 * away (UI-30), so this is a phone's alone — the same split as the rewards
 * strip (RWD-30) and the buttons at the foot of Tasks (UI-34). Without it a
 * mode's page would be a dead end: the bottom bar has no tab for the modes,
 * only More.
 */
export function ModesBackLink({ onBack }: { onBack: () => void }) {
  return (
    <button type="button" onClick={onBack} aria-label={`Back to ${VIEW_LABELS.modes}`} className={link}>
      <ChevronIcon className="size-4 shrink-0 rotate-90" />
      {VIEW_LABELS.modes}
    </button>
  )
}

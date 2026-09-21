import { UNDER_MORE, VIEW_LABELS, type FixedView } from '../view'
import { VIEW_ICONS } from '../viewIcons'
import { ProcrastinationIcon } from './ProcrastinationIcon'
import type { ProcrastinationPhase } from './ProcrastinationMode'

const row =
  'flex min-h-14 w-full items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left text-lg text-neutral-900 transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:border-neutral-700'

const rowOn =
  'flex min-h-14 w-full items-center gap-3 rounded-xl border border-sky-400/60 bg-sky-50 px-4 py-3 text-left text-lg text-sky-900 transition-colors hover:border-sky-400 dark:border-sky-500/40 dark:bg-sky-950/50 dark:text-sky-100 dark:hover:border-sky-500/60'

interface MorePageProps {
  onOpen: (view: FixedView) => void
  /** When set, Procrastination mode can be started or ended from this page (JUST-1). */
  procrastination?: {
    phase: ProcrastinationPhase
    available: boolean
    onStart: () => void
    onEnd: () => void
  }
}

/**
 * More's page: Tags and Rewards (no tab or sidebar entry of their own), and
 * Procrastination mode when it is available — each a tap away.
 */
export function MorePage({ onOpen, procrastination }: MorePageProps) {
  const modeOn = procrastination !== undefined && procrastination.phase !== 'off'

  return (
    <ul className="flex flex-col gap-1">
      {UNDER_MORE.map((value) => {
        const Icon = VIEW_ICONS[value]
        return (
          <li key={value}>
            <button type="button" onClick={() => { onOpen(value) }} className={row}>
              <Icon className="size-5 shrink-0 text-neutral-400 dark:text-neutral-500" />
              {VIEW_LABELS[value]}
            </button>
          </li>
        )
      })}
      {procrastination?.available === true && (
        <li>
          <button
            type="button"
            onClick={() => {
              if (procrastination.phase === 'off') procrastination.onStart()
              else procrastination.onEnd()
            }}
            aria-pressed={modeOn}
            aria-label={modeOn ? 'Procrastination mode on' : 'Procrastination mode'}
            className={modeOn ? rowOn : row}
          >
            <ProcrastinationIcon className="inline-flex size-5 shrink-0 items-center justify-center text-xl leading-none" />
            Procrastination
          </button>
        </li>
      )}
    </ul>
  )
}

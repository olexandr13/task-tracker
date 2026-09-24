import type { ModeState } from '../modes'
import { describeModeHint, MODE_SUMMARY } from '../modeLabels'
import { UNDER_MODES, VIEW_LABELS, type ModeView } from '../view'
import { VIEW_ICONS } from '../viewIcons'
import { ChevronIcon } from './ChevronIcon'
import { ModeSwitch } from './ModeSwitch'

const row =
  'flex min-h-16 w-full items-center gap-1 rounded-xl border border-neutral-200 bg-white pr-2 pl-1 text-neutral-900 transition-colors dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100'

/** On, a mode takes the same sky tint its banner wears on Today. */
const rowOn =
  'flex min-h-16 w-full items-center gap-1 rounded-xl border border-sky-400/60 bg-sky-50 pr-2 pl-1 text-sky-900 transition-colors dark:border-sky-500/40 dark:bg-sky-950/50 dark:text-sky-100'

const open =
  'flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-neutral-100/70 active:bg-neutral-100 dark:hover:bg-neutral-800/50 dark:active:bg-neutral-800'

interface ModesPageProps {
  /** Every mode, however many there are. */
  modes: Record<ModeView, ModeState>
  /** Opens one mode's own page, where it says what it does (MODE-5). */
  onOpen: (view: ModeView) => void
}

/**
 * The modes, listed: each with where it stands, a switch to turn it on or off
 * without leaving the page, and the rest of the row going to what it does
 * (MODE-2, MODE-3, MODE-4).
 *
 * A mode is a spell of the app behaving differently — one task at a time, or
 * one more habit with each day — which is more than a name can carry, so the row is
 * two things at once: the switch, and the way to read about it first.
 */
export function ModesPage({ modes, onOpen }: ModesPageProps) {
  return (
    <ul className="flex flex-col gap-1.5">
      {UNDER_MODES.map((view) => (
        <li key={view}>
          <ModeRow mode={modes[view]} onOpen={() => { onOpen(view) }} />
        </li>
      ))}
    </ul>
  )
}

function ModeRow({ mode, onOpen }: { mode: ModeState; onOpen: () => void }) {
  const Icon = VIEW_ICONS[mode.view]
  const label = VIEW_LABELS[mode.view]

  return (
    <div className={mode.on ? rowOn : row}>
      <button type="button" onClick={onOpen} title={describeModeHint(mode.view)} className={open}>
        <Icon className="inline-flex size-6 shrink-0 items-center justify-center text-xl leading-none" />

        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-lg leading-6">{label}</span>
          <span className="truncate text-xs text-neutral-500 dark:text-neutral-400">{MODE_SUMMARY[mode.view]}</span>
          {/* Whether it is on is said under the switch; this is the rest of where it stands (MODE-3). */}
          {mode.status.detail !== null && (
            <span className="truncate text-xs text-neutral-600 dark:text-neutral-300">{mode.status.detail}</span>
          )}
        </span>

        {/* A page to go to behind the row, where the switch beside it is the mode itself. */}
        <ChevronIcon className="size-5 shrink-0 -rotate-90 text-neutral-300 dark:text-neutral-600" />
      </button>

      <ModeSwitch
        label={label}
        state={mode.status.state}
        checked={mode.on}
        blocked={mode.blocked}
        onChange={mode.toggle}
      />
    </div>
  )
}

import { MODE_POINTS, MODE_SUMMARY } from '../modeLabels'
import type { ModeState } from '../modes'
import { VIEW_LABELS } from '../view'
import { VIEW_ICONS } from '../viewIcons'
import { ModeSwitch } from './ModeSwitch'

const card =
  'flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3.5 dark:border-neutral-800 dark:bg-neutral-900'

const cardOn =
  'flex items-center gap-3 rounded-xl border border-sky-400/60 bg-sky-50 px-4 py-3.5 text-sky-900 dark:border-sky-500/40 dark:bg-sky-950/50 dark:text-sky-100'

const heading = 'text-sm font-medium text-neutral-700 dark:text-neutral-300'

/**
 * One mode's own page: what it is, where it stands, its switch, and what being
 * on actually does — a thing at a time, in the words the mode would use about
 * itself (MODE-5).
 *
 * A switch on a list says only its name, and the name of a mode cannot carry a
 * spell of the whole app behaving differently. This page is where that is said,
 * so turning one on is a decision rather than a guess.
 */
export function ModePage({ mode }: { mode: ModeState }) {
  const Icon = VIEW_ICONS[mode.view]
  const label = VIEW_LABELS[mode.view]

  return (
    <div className="flex flex-col gap-6">
      <div className={mode.on ? cardOn : card}>
        <Icon className="inline-flex size-7 shrink-0 items-center justify-center text-2xl leading-none" />

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-lg leading-6">{label}</span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">{MODE_SUMMARY[mode.view]}</span>
          {/* Whether it is on is said under the switch; this is the rest of where it stands (MODE-3). */}
          {mode.status.detail !== null && (
            <span className="text-xs text-neutral-600 dark:text-neutral-300">{mode.status.detail}</span>
          )}
        </div>

        <ModeSwitch
          label={label}
          state={mode.status.state}
          checked={mode.on}
          blocked={mode.blocked}
          onChange={mode.toggle}
        />
      </div>

      <section aria-label="What it does" className="flex flex-col gap-2">
        <h2 className={heading}>What it does</h2>
        <ul className="flex flex-col gap-2.5">
          {MODE_POINTS[mode.view].map((point) => (
            <li
              key={point}
              className="flex gap-2.5 text-sm leading-5 text-neutral-700 dark:text-neutral-300"
            >
              <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-600" />
              {point}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

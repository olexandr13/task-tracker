import { morePagesShown, useFeaturesOff } from '../features'
import { VIEW_LABELS, type FixedView } from '../view'
import { VIEW_ICONS } from '../viewIcons'
import { ChevronIcon } from './ChevronIcon'

const row =
  'flex min-h-14 w-full items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left text-lg text-neutral-900 transition-colors hover:border-neutral-300 active:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:border-neutral-700 dark:active:bg-neutral-800'

const rowNote = 'ml-auto shrink-0 text-xs tabular-nums text-neutral-500 dark:text-neutral-400'

interface MorePageProps {
  onOpen: (view: FixedView) => void
  /** How many modes are on, for the note on the Modes row (MODE-1). */
  modesOn?: number
}

/**
 * More's page: the pages a phone's bar has no tab for — Lists, Tags, Modes,
 * which holds the modes (MODE-1), Balance (BAL-1), the activity log (ACT-1)
 * and the journal (JRN-1), in the sidebar's order. Lists is here as well as behind the Tasks tab
 * (UI-34), which takes a hold or a second tap to open, so it is reached the same
 * way as everything else on a phone. The sidebar has an entry for each of them
 * and none for More (UI-30), so this page is reached from the bar. The modes
 * were rows here while there were two of them and nothing to say about either;
 * they are a page of their own now, so each can say what it does. A page
 * switched off on Settings is not listed (FEAT-2).
 */
export function MorePage({ onOpen, modesOn = 0 }: MorePageProps) {
  const off = useFeaturesOff()

  return (
    <ul className="flex flex-col gap-1">
      {morePagesShown(off).map((value) => {
        const Icon = VIEW_ICONS[value]
        const note = value === 'modes' && modesOn > 0 ? `${String(modesOn)} on` : null

        return (
          <li key={value}>
            <button
              type="button"
              onClick={() => { onOpen(value) }}
              aria-label={note === null ? undefined : `${VIEW_LABELS[value]}, ${note}`}
              className={row}
            >
              <Icon className="size-5 shrink-0 text-neutral-400 dark:text-neutral-500" />
              {VIEW_LABELS[value]}
              {/* What is on behind the row, so More says it without being opened. */}
              {note !== null && <span className={rowNote}>{note}</span>}
              <ChevronIcon
                className={`size-5 shrink-0 -rotate-90 text-neutral-300 dark:text-neutral-600${note === null ? ' ml-auto' : ''}`}
              />
            </button>
          </li>
        )
      })}
    </ul>
  )
}

import { UNDER_MORE, VIEW_LABELS, type FixedView } from '../view'
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
 * More's page: the pages that have no tab or sidebar entry of their own — Tags,
 * and Modes, which holds Procrastination and the warm-up (MODE-1). The modes
 * were rows here while there were two of them and nothing to say about either;
 * they are a page of their own now, so each can say what it does.
 */
export function MorePage({ onOpen, modesOn = 0 }: MorePageProps) {
  return (
    <ul className="flex flex-col gap-1">
      {UNDER_MORE.map((value) => {
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

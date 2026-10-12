import { VIEW_LABELS, type FixedView } from '../view'
import { VIEW_ICONS, type ViewIcon } from '../viewIcons'
import { ChevronIcon } from './ChevronIcon'

const row =
  'flex min-h-14 w-full items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left text-lg text-neutral-900 transition-colors hover:border-neutral-300 active:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:border-neutral-700 dark:active:bg-neutral-800'

const rowNote = 'ml-auto shrink-0 text-xs tabular-nums text-neutral-500 dark:text-neutral-400'

interface PageLinksProps<Page extends FixedView> {
  /** The pages to link to, in the order they are listed. */
  pages: readonly Page[]
  /** A word at the end of a page's row about what is behind it, as `2 on` for Modes (MODE-1). */
  notes?: Partial<Record<Page, string>>
  onOpen: (view: Page) => void
}

/**
 * A page that is a list of pages to go to, as More's (UI-45), Organize's
 * (UI-81) and Reflect's (UI-83) are: each a row with its icon, large enough for
 * a thumb (UI-49), and a chevron at its end marking it as somewhere to go.
 */
export function PageLinks<Page extends FixedView>({ pages, notes = {}, onOpen }: PageLinksProps<Page>) {
  return (
    <ul className="flex flex-col gap-1">
      {pages.map((value) => {
        const Icon: ViewIcon = VIEW_ICONS[value]
        const note = notes[value] ?? null

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
              {/* What is on behind the row, so the page says it without the row being opened. */}
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

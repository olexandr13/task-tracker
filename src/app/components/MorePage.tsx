import { UNDER_MORE, VIEW_LABELS, type FixedView } from '../view'
import { VIEW_ICONS } from '../viewIcons'

interface MorePageProps {
  onOpen: (view: FixedView) => void
}

/**
 * The phone's More page: a list of the screens that have no tab of their own —
 * Tags and Rewards today — each a tap away. The sidebar still has an entry for
 * each; this page is only where the bottom bar has no room for them.
 */
export function MorePage({ onOpen }: MorePageProps) {
  return (
    <ul className="flex flex-col gap-1">
      {UNDER_MORE.map((value) => {
        const Icon = VIEW_ICONS[value]
        return (
          <li key={value}>
            <button
              type="button"
              onClick={() => { onOpen(value) }}
              className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left text-lg text-neutral-900 transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:border-neutral-700"
            >
              <Icon className="size-5 shrink-0 text-neutral-400 dark:text-neutral-500" />
              {VIEW_LABELS[value]}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

import type { TagSummary } from '../../core'
import { deleteControl } from '../rowControls'
import { TagIcon } from './TagIcon'

interface TagListProps {
  /** Every tag in use, alphabetically, as `summarizeTags` gives them. */
  tags: readonly TagSummary[]
  onOpen: (name: string) => void
  /** Takes the tag off every task carrying it. */
  onDelete: (name: string) => void
}

/**
 * The Tags page: every tag in use, each opening the list of the tasks carrying
 * it. Beside each, how many of those are still to do — nothing once they all
 * are done, the tag being no less a tag for it — and a button deleting the tag.
 */
export function TagList({ tags, onOpen, onDelete }: TagListProps) {
  if (tags.length === 0) {
    return (
      <p className="py-10 text-center text-neutral-400 dark:text-neutral-600">
        No tags yet. Tag a task from its menu — right-click it, or open it on a phone — or type # in its
        description.
      </p>
    )
  }

  function handleDelete(name: string) {
    // It comes off every task at once, with nothing to undo it from, so it asks first.
    if (window.confirm(`Delete the tag "${name}"? It comes off every task that carries it; the tasks stay.`)) {
      onDelete(name)
    }
  }

  return (
    <ul className="flex flex-col gap-1">
      {tags.map(({ name, open }) => (
        <li
          key={name}
          className="flex items-center rounded-xl border border-neutral-200 bg-white pr-1.5 transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
        >
          <button
            type="button"
            onClick={() => { onOpen(name) }}
            aria-label={open === 0 ? name : `${name}: ${String(open)} to do`}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-l-xl px-3 py-2 text-left text-sm text-neutral-900 dark:text-neutral-100"
          >
            <TagIcon className="size-4 shrink-0 text-neutral-400 dark:text-neutral-500" />
            <span className="min-w-0 flex-1 truncate">{name}</span>
            {open > 0 && (
              <span aria-hidden="true" className="shrink-0 text-xs text-neutral-400 tabular-nums dark:text-neutral-500">
                {open}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => { handleDelete(name) }}
            aria-label={`Delete the tag "${name}"`}
            title="Delete tag"
            className={`flex h-6 shrink-0 items-center rounded-lg px-1.5 text-base leading-none ${deleteControl}`}
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  )
}

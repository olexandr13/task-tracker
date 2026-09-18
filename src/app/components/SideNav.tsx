import { Fragment, type ReactElement } from 'react'
import { sortLists, type List, type ListId } from '../../core'
import { useListDropTarget } from '../useListDropTarget'
import { isUnder, oneListView, VIEW_LABELS, type FixedView, type View } from '../view'
import { VIEW_ICONS } from '../viewIcons'
import { FolderIcon } from './FolderIcon'
import { InboxIcon } from './InboxIcon'

/**
 * The views, grouped: the ones named after a period, then every task, the lists,
 * the habits, the rewards and the tags, then the trash, then settings. A thin
 * line is drawn between groups. Lists is always open, with the Inbox and every
 * list under it, so a list is one click away and a task can be dropped on one to
 * file it. A tag's tasks have no entry: those are reached from Tags.
 */
const VIEW_GROUPS: readonly (readonly FixedView[])[] = [
  ['today', 'week', 'month'],
  ['tasks', 'lists', 'habits', 'rewards', 'tags'],
  ['trash'],
  ['settings'],
]

const item = 'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors'
const itemOn = 'bg-neutral-200/70 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
const itemOff =
  'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100'

/** A list under Lists: indented to start where the word Lists does, and a little shorter. */
const subItem = 'flex w-full min-w-0 items-center gap-2 rounded-lg py-1.5 pr-3 pl-[2.375rem] text-left text-sm transition-colors'
/** A task being carried over it, to be dropped there. */
const subItemOver = 'bg-blue-50 text-blue-700 ring-1 ring-blue-300 ring-inset dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/40'
const subGlyph = 'size-3.5 shrink-0'

interface SideNavProps {
  view: View
  /** Every list there is, to go to and to drop a task on. */
  lists: readonly List[]
  onChange: (view: View) => void
}

/**
 * Which screen you are on: a plain list down the left. Only where there is room
 * for one — a phone gets the bar along the bottom instead (BottomNav). The one
 * you are on is marked, a list under Lists included. Tags stays marked while a
 * tag's tasks are open, being where they were opened from.
 */
export function SideNav({ view, lists, onChange }: SideNavProps) {
  return (
    <nav aria-label="Views" className="hidden md:block md:w-44 md:shrink-0">
      <ul className="flex flex-col gap-0.5">
        {VIEW_GROUPS.map((group, index) => (
          <Fragment key={group[0]}>
            {index > 0 && (
              <li aria-hidden="true" className="mx-3 my-1.5 border-t border-neutral-200 dark:border-neutral-800" />
            )}
            {group.map((value) =>
              value === 'lists' ? (
                <li key={value}>
                  <NavButton value={value} active={view === 'lists'} onSelect={onChange} />
                  <ul aria-label="Lists" className="mt-0.5 flex flex-col gap-0.5">
                    <ListEntry
                      listId={null}
                      name={VIEW_LABELS.inbox}
                      icon={<InboxIcon className={subGlyph} />}
                      active={view === 'inbox'}
                      onSelect={() => { onChange('inbox') }}
                    />
                    {sortLists(lists).map((list) => (
                      <ListEntry
                        key={list.id}
                        listId={list.id}
                        name={list.name}
                        icon={<FolderIcon className={subGlyph} />}
                        active={view === oneListView(list.id)}
                        onSelect={() => { onChange(oneListView(list.id)) }}
                      />
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={value}>
                  <NavButton value={value} active={isUnder(view, value)} onSelect={onChange} />
                </li>
              ),
            )}
          </Fragment>
        ))}
      </ul>
    </nav>
  )
}

function NavButton({ value, active, onSelect }: { value: FixedView; active: boolean; onSelect: (view: View) => void }) {
  const Icon = VIEW_ICONS[value]

  return (
    <button
      type="button"
      onClick={() => { onSelect(value) }}
      aria-current={active ? 'page' : undefined}
      className={active ? `${item} ${itemOn}` : `${item} ${itemOff}`}
    >
      <Icon />
      {VIEW_LABELS[value]}
    </button>
  )
}

interface ListEntryProps {
  /** The list, or null for the Inbox. */
  listId: ListId | null
  name: string
  icon: ReactElement
  active: boolean
  onSelect: () => void
}

/** A list under Lists: goes to its view, and files a task dropped on it. */
function ListEntry({ listId, name, icon, active, onSelect }: ListEntryProps) {
  const { isOver, setNodeRef } = useListDropTarget(listId, name)
  const tone = isOver ? subItemOver : active ? itemOn : itemOff

  return (
    <li ref={setNodeRef}>
      <button
        type="button"
        onClick={onSelect}
        aria-current={active ? 'page' : undefined}
        title={name}
        className={`${subItem} ${tone}`}
      >
        {icon}
        <span className="min-w-0 truncate">{name}</span>
      </button>
    </li>
  )
}

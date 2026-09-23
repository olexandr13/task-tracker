import { Fragment, useId, type ReactElement, type ReactNode } from 'react'
import { sortLists, type List, type ListId } from '../../core'
import { useListDropTarget } from '../useListDropTarget'
import { isUnder, oneListView, UNDER_REWARDS, VIEW_LABELS, type FixedView, type View } from '../view'
import { VIEW_ICONS } from '../viewIcons'
import { AppLogo } from './AppLogo'
import { ChevronIcon } from './ChevronIcon'
import { FolderIcon } from './FolderIcon'
import { InboxIcon } from './InboxIcon'

/**
 * The views, grouped: the ones named after a period, then every task, the
 * habits, the lists, the rewards and More, then the trash, then settings. A
 * thin line is drawn between groups. Lists opens onto the Inbox and every list
 * under it, so a list is one click away and a task can be dropped on one to
 * file it, and folds them away when they are not wanted. Rewards keeps its
 * three pages under it in the same way, and folds them away the same way. Tags
 * and Procrastination live under More, and a tag's tasks have no entry of their own.
 */
const VIEW_GROUPS: readonly (readonly FixedView[])[] = [
  ['today', 'week', 'month'],
  ['tasks', 'habits', 'lists', 'rewards', 'more'],
  ['trash'],
  ['settings'],
]

/** Every view listed here, whatever group it is in. */
const LISTED: ReadonlySet<View> = new Set<View>(VIEW_GROUPS.flat())

/**
 * Whether an entry is the one you are on. More stands for the pages under it
 * (UI-45) — but not for one this sidebar lists itself, or two entries would be
 * marked at once. Lists and Rewards are their own case, being folded or not
 * (`FoldableEntry`).
 */
function isOn(view: View, value: FixedView): boolean {
  if (value === 'more' && view !== 'more' && LISTED.has(view)) return false
  return isUnder(view, value)
}

const item = 'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors'
const itemOn = 'bg-neutral-200/70 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
const itemOff =
  'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100'

/** A page under Lists or Rewards: indented to start where the word above does, and a little shorter. */
const subItem = 'flex w-full min-w-0 items-center gap-2 rounded-lg py-1.5 pr-3 pl-[2.375rem] text-left text-sm transition-colors'
/** A task being carried over it, to be dropped there. */
const subItemOver = 'bg-blue-50 text-blue-700 ring-1 ring-blue-300 ring-inset dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/40'
const subGlyph = 'size-3.5 shrink-0'

/** The chevron at the end of Lists or Rewards that folds what is under it: quiet until pointed at. */
const foldButton =
  'absolute inset-y-0 right-1.5 my-auto grid size-6 place-items-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-200/70 hover:text-neutral-900 dark:text-neutral-500 dark:hover:bg-neutral-700/60 dark:hover:text-neutral-100'

interface SideNavProps {
  view: View
  /** Every list there is, to go to and to drop a task on. */
  lists: readonly List[]
  /** Whether the lists are shown under Lists, or folded away. */
  listsOpen: boolean
  /** Whether the rewards pages are shown under Rewards, or folded away. */
  rewardsOpen: boolean
  /** Soften the sidebar while Procrastination mode is on (JUST-5). */
  dimmed?: boolean
  onChange: (view: View) => void
  onListsOpenChange: (open: boolean) => void
  onRewardsOpenChange: (open: boolean) => void
}

/**
 * Which screen you are on: a plain list down the left, under the app's mark.
 * Only where there is room for one — a phone gets the bar along the bottom
 * instead (BottomNav), and no mark above the work. The one you are on is
 * marked, a list under Lists included — or Lists itself while the lists are
 * folded away. More stays marked while Tags or a tag's tasks are open; Rewards
 * has its own entry here, with the history, the wishlist and the rules under it,
 * and each of the four is marked itself (RWD-19) — or Rewards alone while they
 * are folded away, as with Lists.
 */
export function SideNav({
  view,
  lists,
  listsOpen,
  rewardsOpen,
  dimmed = false,
  onChange,
  onListsOpenChange,
  onRewardsOpenChange,
}: SideNavProps) {
  const listsId = useId()
  const rewardsId = useId()

  return (
    <nav
      aria-label="Views"
      className={`hidden md:block md:w-44 md:shrink-0${dimmed ? ' opacity-25' : ''}`}
    >
      <AppLogo className="mb-3 flex items-center gap-2.5 px-3" />
      <ul className="flex flex-col gap-0.5">
        {VIEW_GROUPS.map((group, index) => (
          <Fragment key={group[0]}>
            {index > 0 && (
              <li aria-hidden="true" className="mx-3 my-1.5 border-t border-neutral-200 dark:border-neutral-800" />
            )}
            {group.map((value) =>
              value === 'lists' ? (
                <FoldableEntry
                  key={value}
                  value={value}
                  // Folded away, Lists stands for whatever is under it; open, each list is marked itself.
                  active={listsOpen ? view === 'lists' : isUnder(view, 'lists')}
                  open={listsOpen}
                  id={listsId}
                  foldLabel="Show lists"
                  onSelect={onChange}
                  onOpenChange={onListsOpenChange}
                >
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
                </FoldableEntry>
              ) : value === 'rewards' ? (
                <FoldableEntry
                  key={value}
                  value={value}
                  active={rewardsOpen ? view === 'rewards' : isUnder(view, 'rewards')}
                  open={rewardsOpen}
                  id={rewardsId}
                  foldLabel="Show rewards pages"
                  onSelect={onChange}
                  onOpenChange={onRewardsOpenChange}
                >
                  {UNDER_REWARDS.map((page) => (
                    <SubNavButton key={page} value={page} active={view === page} onSelect={onChange} />
                  ))}
                </FoldableEntry>
              ) : (
                <li key={value}>
                  <NavButton value={value} active={isOn(view, value)} onSelect={onChange} />
                </li>
              ),
            )}
          </Fragment>
        ))}
      </ul>
    </nav>
  )
}

interface FoldableEntryProps {
  value: FixedView
  active: boolean
  /** Whether what is under it is shown, or folded away. */
  open: boolean
  /** What the chevron controls, for a screen reader. */
  id: string
  foldLabel: string
  onSelect: (view: View) => void
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

/**
 * An entry with pages under it — Lists, Rewards — each a click away, and a
 * chevron that folds them away when they are not wanted (LST-26, RWD-19). The
 * entry itself still goes to its own page.
 */
function FoldableEntry({ value, active, open, id, foldLabel, onSelect, onOpenChange, children }: FoldableEntryProps) {
  return (
    <li>
      <div className="relative">
        <NavButton value={value} active={active} onSelect={onSelect} />
        <button
          type="button"
          onClick={() => { onOpenChange(!open) }}
          aria-expanded={open}
          aria-controls={open ? id : undefined}
          aria-label={foldLabel}
          className={foldButton}
        >
          <ChevronIcon className={`size-4 transition-transform ${open ? '' : '-rotate-90'}`} />
        </button>
      </div>
      {open && (
        <ul id={id} aria-label={VIEW_LABELS[value]} className="mt-0.5 flex flex-col gap-0.5">
          {children}
        </ul>
      )}
    </li>
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

/** A page under Rewards: the same indent as a list under Lists, and nothing to drop on it. */
function SubNavButton({ value, active, onSelect }: { value: FixedView; active: boolean; onSelect: (view: View) => void }) {
  const Icon = VIEW_ICONS[value]

  return (
    <li>
      <button
        type="button"
        onClick={() => { onSelect(value) }}
        aria-current={active ? 'page' : undefined}
        className={`${subItem} ${active ? itemOn : itemOff}`}
      >
        <Icon className={subGlyph} />
        <span className="min-w-0 truncate">{VIEW_LABELS[value]}</span>
      </button>
    </li>
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

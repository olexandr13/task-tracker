import { Fragment, useId, type ReactElement, type ReactNode } from 'react'
import { sortLists, type List, type ListId } from '../../core'
import { isViewOn, modesShown, rewardsPagesShown, useFeaturesOff } from '../features'
import { navItemOff, navItemOn } from '../navTones'
import { useListDropTarget } from '../useListDropTarget'
import { isUnder, oneListView, VIEW_LABELS, type FixedView, type View } from '../view'
import { VIEW_ICONS } from '../viewIcons'
import { AppLogo } from './AppLogo'
import { ChevronIcon } from './ChevronIcon'
import { FolderIcon } from './FolderIcon'
import { InboxIcon } from './InboxIcon'
import { KeyWaitingMark } from './KeyWaitingMark'

/**
 * The views, grouped by what they are for (UI-30): when — the ones named after
 * a period; the work and where it is filed — the habits, every task, the lists
 * and the tags; what pushes it along — the rewards and the modes; looking back
 * at the time spent — the balance of time and the activity log; then the trash,
 * then settings. A thin line is drawn between groups. Lists opens onto the
 * Inbox and every list under it, so a list is one click away and a task can be
 * dropped on one to file it, and folds them away when they are not wanted.
 * Rewards keeps its pages under it in the same way, and Modes a page for each
 * mode (MODE-7); both fold away as Lists does. Tags is an entry of its own, and
 * a tag's tasks have none. More is not here: every page on it is, so it would
 * be a click on the way to somewhere already listed (UI-45). A page whose
 * feature is switched off on Settings has no entry at all (FEAT-2).
 */
const VIEW_GROUPS: readonly (readonly FixedView[])[] = [
  ['today', 'week', 'month'],
  ['habits', 'tasks', 'lists', 'tags'],
  ['rewards', 'modes'],
  ['balance', 'activity'],
  ['trash'],
  ['settings'],
]

const item = 'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors'

/** A page under Lists, Rewards or Modes: indented to start where the word above does, and a little shorter. */
const subItem = 'flex w-full min-w-0 items-center gap-2 rounded-lg py-1.5 pr-3 pl-[2.375rem] text-left text-sm transition-colors'
/** A task being carried over it, to be dropped there. */
const subItemOver = 'bg-blue-50 text-blue-700 ring-1 ring-blue-300 ring-inset dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/40'
const subGlyph = 'size-3.5 shrink-0'
/** A mode wears an emoji rather than a drawing, which needs a box of its own to sit in the middle of. */
const subEmoji = 'inline-flex size-3.5 shrink-0 items-center justify-center text-[0.8125rem] leading-none'

/**
 * How an entry is softened while Procrastination mode is on (JUST-5). It sits on
 * each entry rather than on the sidebar itself: opacity fades a whole box and
 * everything in it at once, so a lit Today inside a faded sidebar is not a thing
 * a child can ask for.
 */
const dim = 'opacity-25'

/** The chevron at the end of Lists, Rewards or Modes that folds what is under it: quiet until pointed at. */
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
  /** Whether each mode's page is shown under Modes, or folded away. */
  modesOpen: boolean
  /** Whether a key is waiting, which marks Cases under Rewards (CHST-22). */
  keyWaiting?: boolean
  /** Soften the sidebar, Today apart, while Procrastination mode is on (JUST-5). */
  dimmed?: boolean
  onChange: (view: View) => void
  onListsOpenChange: (open: boolean) => void
  onRewardsOpenChange: (open: boolean) => void
  onModesOpenChange: (open: boolean) => void
}

/**
 * Which screen you are on: a plain list down the left, under the app's mark.
 * Only where there is room for one — a phone gets the bar along the bottom
 * instead (BottomNav), and no mark above the work. The one you are on is
 * marked, a list under Lists included — or Lists itself while the lists are
 * folded away. Tags stays marked while a tag's tasks are open (TAG-17); Rewards
 * has its own entry here, with Cases, the history, the prizes, the wishlist
 * and the rules under it, and each of the five is marked itself (RWD-19) — or Rewards alone while they
 * are folded away, as with Lists. Modes is listed the same way, with each mode's
 * page under it, so going from one mode to the other is a step down the sidebar
 * rather than a strip across the top of them (MODE-7).
 */
export function SideNav({
  view,
  lists,
  listsOpen,
  rewardsOpen,
  modesOpen,
  keyWaiting = false,
  dimmed = false,
  onChange,
  onListsOpenChange,
  onRewardsOpenChange,
  onModesOpenChange,
}: SideNavProps) {
  const listsId = useId()
  const rewardsId = useId()
  const modesId = useId()
  // What is switched off on Settings has no entry here (FEAT-2).
  const off = useFeaturesOff()

  // Today is where the one task is, so it stays at full strength while the rest
  // of the sidebar softens: the way back is always readable (JUST-5).
  const soften = (value: FixedView) => (dimmed && value !== 'today' ? dim : undefined)

  // A group whose every page is switched off is left out whole, so no two lines
  // meet with nothing between them.
  const groups = VIEW_GROUPS.map((group) => group.filter((value) => isViewOn(value, off))).filter(
    (group) => group.length > 0,
  )

  return (
    <nav aria-label="Views" className="hidden md:block md:w-44 md:shrink-0">
      <AppLogo className={`mb-3 flex items-center gap-2.5 px-3${dimmed ? ` ${dim}` : ''}`} />
      <ul className="flex flex-col gap-0.5">
        {groups.map((group, index) => (
          <Fragment key={group[0]}>
            {index > 0 && (
              <li
                aria-hidden="true"
                className={`mx-3 my-1.5 border-t border-neutral-200 dark:border-neutral-800${dimmed ? ` ${dim}` : ''}`}
              />
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
                  dimmed={dimmed}
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
                  dimmed={dimmed}
                  foldLabel="Show rewards pages"
                  onSelect={onChange}
                  onOpenChange={onRewardsOpenChange}
                >
                  {rewardsPagesShown(off).map((page) => (
                    <SubNavButton
                      key={page}
                      value={page}
                      active={view === page}
                      marked={page === 'rewards/cases' && keyWaiting}
                      onSelect={onChange}
                    />
                  ))}
                </FoldableEntry>
              ) : value === 'modes' ? (
                <FoldableEntry
                  key={value}
                  value={value}
                  active={modesOpen ? view === 'modes' : isUnder(view, 'modes')}
                  open={modesOpen}
                  id={modesId}
                  dimmed={dimmed}
                  foldLabel="Show modes"
                  onSelect={onChange}
                  onOpenChange={onModesOpenChange}
                >
                  {modesShown(off).map((page) => (
                    <SubNavButton
                      key={page}
                      value={page}
                      active={view === page}
                      glyph={subEmoji}
                      onSelect={onChange}
                    />
                  ))}
                </FoldableEntry>
              ) : (
                <li key={value} className={soften(value)}>
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

interface FoldableEntryProps {
  value: FixedView
  active: boolean
  /** Whether what is under it is shown, or folded away. */
  open: boolean
  /** Softened with the rest of the sidebar while Procrastination mode is on (JUST-5). */
  dimmed: boolean
  /** What the chevron controls, for a screen reader. */
  id: string
  foldLabel: string
  onSelect: (view: View) => void
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

/**
 * An entry with pages under it — Lists, Rewards, Modes — each a click away, and
 * a chevron that folds them away when they are not wanted (LST-26, RWD-19,
 * MODE-7). The entry itself still goes to its own page.
 */
function FoldableEntry({ value, active, open, id, dimmed, foldLabel, onSelect, onOpenChange, children }: FoldableEntryProps) {
  return (
    <li className={dimmed ? dim : undefined}>
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
      className={active ? `${item} ${navItemOn}` : `${item} ${navItemOff}`}
    >
      <Icon />
      {VIEW_LABELS[value]}
    </button>
  )
}

interface SubNavButtonProps {
  value: FixedView
  active: boolean
  /** Something is waiting on this page: a dot after its name (CHST-22). */
  marked?: boolean
  /** How the page's glyph is drawn: a mode's emoji needs more said than a drawing does. */
  glyph?: string
  onSelect: (view: View) => void
}

/** A page under Rewards or Modes: the same indent as a list under Lists, and nothing to drop on it. */
function SubNavButton({ value, active, marked = false, glyph = subGlyph, onSelect }: SubNavButtonProps) {
  const Icon = VIEW_ICONS[value]

  return (
    <li>
      <button
        type="button"
        onClick={() => { onSelect(value) }}
        aria-current={active ? 'page' : undefined}
        className={`${subItem} ${active ? navItemOn : navItemOff}`}
      >
        <Icon className={glyph} />
        <span className="min-w-0 truncate">{VIEW_LABELS[value]}</span>
        {marked && <KeyWaitingMark />}
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
  const tone = isOver ? subItemOver : active ? navItemOn : navItemOff

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

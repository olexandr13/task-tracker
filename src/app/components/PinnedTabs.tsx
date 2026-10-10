import {
  closestCenter,
  DndContext,
  MouseSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type Modifier,
} from '@dnd-kit/core'
import { horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useRef } from 'react'
import type { List } from '../../core'
import { useFeaturesOff } from '../features'
import { isLetterShortcut } from '../letterShortcut'
import { navItemOff, navItemOn } from '../navTones'
import { tabsShown } from '../pinnedTabs'
import { usePhoneLayout } from '../usePhoneLayout'
import { isOneListView, isTagView, viewLabel, type View } from '../view'
import { VIEW_ICONS } from '../viewIcons'
import { CloseIcon } from './CloseIcon'
import { FolderIcon } from './FolderIcon'
import { KeyWaitingMark } from './KeyWaitingMark'
import { PinIcon } from './PinIcon'
import { TagIcon } from './TagIcon'

/**
 * One tab: wide enough for a name, and narrowing with the rest when there are
 * many, as a browser's tabs do — the name gives way, the glyph and the button
 * at the end stay.
 */
const tabSlot = 'group relative min-w-16 shrink basis-48'
const tab = 'flex w-full min-w-0 items-center gap-2 rounded-lg py-1.5 pr-8 pl-3 text-left text-sm transition-colors'
/** The page open, not pinned: outlined rather than filled, a tab only for as long as you are on it. */
const tabUnpinned =
  'border border-dashed border-neutral-300 font-medium text-neutral-900 dark:border-neutral-700 dark:text-neutral-100'
/** The pin or the cross at a tab's end. */
const endButton =
  'absolute inset-y-0 right-1.5 my-auto grid size-6 place-items-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-300/60 hover:text-neutral-900 focus-visible:opacity-100 dark:text-neutral-500 dark:hover:bg-neutral-700/60 dark:hover:text-neutral-100'

/** How a tab is softened while Procrastination mode is on (JUST-5), as the sidebar's entries are. */
const dim = 'opacity-25'

/** A tab is carried along the strip, never up or down off it. */
const alongTheStrip: Modifier = ({ transform }) => ({ ...transform, y: 0 })

/** The keys that open a tab: 1 for the first, up to 9 (UI-79). */
const TAB_KEYS = /^[1-9]$/

interface PinnedTabsProps {
  view: View
  /** The pages pinned, in order, whether or not each is there to draw. */
  pinned: readonly View[]
  /** Every list there is, to name a list's tab and to leave out one whose list is gone. */
  lists: readonly List[]
  /** Every tag there is, to leave out a tag's tab once nothing carries it. */
  tags: readonly string[]
  /** Whether a key is waiting, which marks a Cases tab (CHST-22). */
  keyWaiting?: boolean
  /** Soften every tab but Today's while Procrastination mode is on (JUST-5). */
  dimmed?: boolean
  onChange: (view: View) => void
  onPin: (view: View) => void
  onUnpin: (view: View) => void
  /** A pinned tab dropped where another one is (UI-78). */
  onMove: (from: View, over: View) => void
}

/**
 * The pinned tabs across the top of a wide screen (UI-75): pages kept a click
 * away, as a browser's tabs are, beside the sidebar that lists everything.
 * Each always opens the page it was pinned on. The page open is always a tab —
 * its pinned one, or after them an outlined one with a pin to keep it (UI-76) —
 * so exactly one is marked, and it is where you are. A pinned tab's cross
 * unpins it, without asking: pinning it again is one click.
 *
 * Pinned tabs are dragged into a new order (UI-78), and 1 to 9 open the first
 * nine (UI-79). A phone has none of this: its bar is its navigation (UI-4).
 */
export function PinnedTabs({
  view,
  pinned,
  lists,
  tags,
  keyWaiting = false,
  dimmed = false,
  onChange,
  onPin,
  onUnpin,
  onMove,
}: PinnedTabsProps) {
  const off = useFeaturesOff()
  const { tabs, current } = tabsShown({ pinned, view, off, lists, tags })
  const strip = current === null ? tabs : [...tabs, current]
  const phone = usePhoneLayout()

  // A few pixels of travel before a tab is picked up, so a click is still a click.
  // No keyboard: Space and Enter on a tab open it.
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 5 } }))

  // What the keys open is read when one is pressed, so the listener need not
  // be set again for every change of tab.
  const latest = useRef({ strip, onChange })
  useEffect(() => {
    latest.current = { strip, onChange }
  })

  useEffect(() => {
    if (phone) return

    function handleKeyDown(event: KeyboardEvent) {
      if (!TAB_KEYS.test(event.key) || !isLetterShortcut(event, event.key)) return
      const target = latest.current.strip[Number(event.key) - 1]
      if (target === undefined) return
      event.preventDefault()
      latest.current.onChange(target)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => { window.removeEventListener('keydown', handleKeyDown) }
  }, [phone])

  const nameOf = (tabView: View) => viewLabel(tabView, lists)

  /** Where a tab is, as a person counts: the defaults would read out its address. */
  const placeOf = (id: string | number) =>
    `position ${String(tabs.indexOf(id as View) + 1)} of ${String(tabs.length)}`

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up the ${nameOf(active.id as View)} tab, ${placeOf(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over === null
        ? `The ${nameOf(active.id as View)} tab is not over the tabs.`
        : `The ${nameOf(active.id as View)} tab is over ${placeOf(over.id)}.`,
    onDragEnd: ({ active, over }) =>
      over === null
        ? `The ${nameOf(active.id as View)} tab dropped.`
        : `The ${nameOf(active.id as View)} tab dropped at ${placeOf(over.id)}.`,
    onDragCancel: ({ active }) => `Moving the ${nameOf(active.id as View)} tab was cancelled.`,
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (over === null || active.id === over.id) return
    onMove(active.id as View, over.id as View)
  }

  const soften = (tabView: View) => (dimmed && tabView !== 'today' ? dim : '')

  return (
    <nav aria-label="Pinned tabs" className="hidden border-b border-neutral-200 pb-1.5 md:block dark:border-neutral-800">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[alongTheStrip]}
        accessibility={{ announcements }}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={tabs} strategy={horizontalListSortingStrategy}>
          <ul className="flex min-w-0 gap-1">
            {tabs.map((tabView) => (
              <PinnedTab
                key={tabView}
                view={tabView}
                name={nameOf(tabView)}
                marked={tabView === view}
                keyWaiting={keyWaiting}
                className={soften(tabView)}
                onSelect={onChange}
                onUnpin={onUnpin}
              />
            ))}
            {current !== null && (
              <li className={`${tabSlot} ${soften(current)}`}>
                <TabButton
                  view={current}
                  name={nameOf(current)}
                  marked
                  keyWaiting={keyWaiting}
                  className={`${tab} ${tabUnpinned}`}
                  onSelect={onChange}
                />
                <button
                  type="button"
                  onClick={() => { onPin(current) }}
                  aria-label={`Pin ${nameOf(current)}`}
                  className={endButton}
                >
                  <PinIcon />
                </button>
              </li>
            )}
          </ul>
        </SortableContext>
      </DndContext>
    </nav>
  )
}

interface PinnedTabProps {
  view: View
  name: string
  marked: boolean
  keyWaiting: boolean
  className: string
  onSelect: (view: View) => void
  onUnpin: (view: View) => void
}

/**
 * A pinned tab: picked up anywhere on it and carried along the strip, and
 * closed — unpinned — from the cross at its end. The cross shows on the tab
 * marked, and on any other while it is pointed at or reached by the keyboard.
 */
function PinnedTab({ view, name, marked, keyWaiting, className, onSelect, onUnpin }: PinnedTabProps) {
  const { setNodeRef, listeners, isDragging, transform, transition } = useSortable({ id: view })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`${tabSlot} ${isDragging ? 'z-10' : ''} ${className}`}
    >
      <TabButton
        view={view}
        name={name}
        marked={marked}
        keyWaiting={keyWaiting}
        className={`${tab} ${marked ? navItemOn : navItemOff}`}
        listeners={listeners}
        onSelect={onSelect}
      />
      <button
        type="button"
        onClick={() => { onUnpin(view) }}
        aria-label={`Unpin ${name}`}
        className={`${endButton} ${marked ? '' : 'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100'}`}
      >
        <CloseIcon />
      </button>
    </li>
  )
}

interface TabButtonProps {
  view: View
  name: string
  marked: boolean
  keyWaiting: boolean
  className: string
  /** What picks a pinned tab up; the unpinned one stays where it is. */
  listeners?: ReturnType<typeof useSortable>['listeners']
  onSelect: (view: View) => void
}

/** What a tab opens: its page's glyph and name, as the sidebar draws them. */
function TabButton({ view, name, marked, keyWaiting, className, listeners, onSelect }: TabButtonProps) {
  return (
    <button
      type="button"
      {...listeners}
      onClick={() => { onSelect(view) }}
      aria-current={marked ? 'page' : undefined}
      title={name}
      className={className}
    >
      <TabGlyph view={view} />
      <span className="min-w-0 truncate">{name}</span>
      {view === 'rewards/cases' && keyWaiting && <KeyWaitingMark />}
    </button>
  )
}

/** The glyph a tab's page carries in the sidebar: a list's the folder Lists has, a tag's the mark Tags has. */
function TabGlyph({ view }: { view: View }) {
  if (isOneListView(view)) return <FolderIcon />
  if (isTagView(view)) return <TagIcon />
  const Icon = VIEW_ICONS[view]
  return <Icon />
}

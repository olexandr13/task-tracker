import { Fragment, type KeyboardEvent, type ReactNode } from 'react'
import {
  panelHeading as heading,
  panelIcon,
  panelIconOff,
  panelIconOn,
  panelIconRow,
  panelOptionOn,
} from '../panelControls'
import { BarPanel } from './BarPanel'
import { FloatingPanel } from './FloatingPanel'

export interface ContextMenuItem {
  label: string
  onSelect: () => void
  /**
   * For one of a set to choose between: whether it is the one chosen, which is
   * marked and heard as a choice rather than an action. Left out for an action.
   */
  checked?: boolean
  /**
   * For a mark that is simply on or off, such as Urgent: heard as a toggle, and
   * shown by tinting its name and glyph rather than by a tick. A tick's column
   * would indent it alone, out of line with the actions beside it (UI-31).
   */
  toggled?: boolean
  /** A glyph drawn before the label, for an action found at a glance. */
  icon?: ReactNode
}

/** Items that belong together, under a heading of their own and set off from the rest by a line. */
export interface ContextMenuGroup {
  group: string
  items: readonly ContextMenuItem[]
}

/**
 * An item and the items under it, as the sidebar has the Inbox and the lists
 * under Lists: the head is a choice of its own, what belongs to it is indented
 * beneath, and the whole is set off by a line — so the head names the group
 * rather than a heading repeating its words.
 */
export interface ContextMenuSection extends ContextMenuItem {
  under: readonly ContextMenuItem[]
}

/** An item drawn as an icon alone: its label is its name, and its tooltip unless it has a hint. */
export interface ContextMenuIcon extends ContextMenuItem {
  icon: ReactNode
  /** The tooltip, where it says more than the label, such as the day a choice sets. */
  hint?: string
}

/**
 * Quick choices that belong together, laid out as one row of icons under a
 * heading of their own — choices used often enough that a line of words each
 * would crowd the rest of the menu out.
 */
export interface ContextMenuIconGroup {
  group: string
  icons: readonly ContextMenuIcon[]
}

export type ContextMenuEntry = ContextMenuItem | ContextMenuSection | ContextMenuGroup | ContextMenuIconGroup

/** Whether an entry stands apart from its neighbours, and so is set off by a line. */
function isGrouped(entry: ContextMenuEntry): boolean {
  return 'group' in entry || 'under' in entry
}

/**
 * Where the menu opens: at the point it was asked for — where a right-click was —
 * or along the phone's bottom bar, rising from the tab it belongs to (UI-66).
 */
export type ContextMenuPlace =
  | { at: 'point'; x: number; y: number; align?: 'left' | 'right' | 'center' }
  | { at: 'bar'; top: number }

interface ContextMenuProps {
  place: ContextMenuPlace
  /** What the menu is for, when there could be more than one on screen. */
  label: string
  items: readonly ContextMenuEntry[]
  /**
   * Whether it was opened from the keyboard, which puts focus on its first item.
   * Opened by a pointer nothing is picked out, and the arrow keys start from the top.
   */
  fromKeyboard?: boolean
  onClose: () => void
}

/** Every kind of item the arrow keys move between. */
const ITEMS = '[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]'

const itemLook =
  'group touch-manipulation whitespace-nowrap transition-colors hover:bg-neutral-100 focus-visible:bg-neutral-100 focus-visible:outline-none dark:hover:bg-neutral-800 dark:focus-visible:bg-neutral-800'

/**
 * Compact on a wide screen, as every panel is (UI-40). On a phone tall and
 * wide enough for a thumb, so the bottom bar's menus and a task's menu are not
 * a precise tap (UI-49).
 */
const item =
  `flex min-h-14 w-full min-w-0 items-center gap-3 rounded-xl px-3.5 py-3.5 text-left text-lg md:min-h-0 md:gap-1.5 md:rounded-lg md:px-2 md:py-1 md:text-sm ${itemLook}`

/**
 * Indented to start where the line above it starts its name, as the sidebar
 * indents a list under Lists — the extra left padding matching the icon and
 * gap of the line above, at both sizes.
 */
const subItem =
  `flex min-h-14 w-full min-w-0 items-center gap-3 rounded-xl py-3.5 pr-3.5 pl-[3.125rem] text-left text-lg md:min-h-0 md:gap-1.5 md:rounded-lg md:py-1 md:pr-2 md:pl-[1.875rem] md:text-sm ${itemLook}`
const itemOff =
  'text-neutral-700 hover:text-neutral-900 focus-visible:text-neutral-900 dark:text-neutral-200 dark:hover:text-neutral-100 dark:focus-visible:text-neutral-100'
const iconItem = `${panelIcon} focus-visible:bg-neutral-100 focus-visible:outline-none dark:focus-visible:bg-neutral-800`
/** The glyph before a name, sized with the words it marks. */
const itemIcon = 'grid shrink-0 place-items-center [&>svg]:size-6 md:[&>svg]:size-4'
/** Quieter than the words it marks, and up with them under the pointer. A glyph on
 * an item that is on keeps the item's own tint instead. */
const itemIconOff =
  'text-neutral-400 transition-colors group-hover:text-neutral-600 group-focus-visible:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-300 dark:group-focus-visible:text-neutral-300'
const iconOff = `${panelIconOff} focus-visible:text-neutral-900 dark:focus-visible:text-neutral-100`
const group = 'flex flex-col gap-1 md:gap-0.5'

/**
 * Which item a key moves to, round from the last to the first and back; null for
 * a key that moves nothing. Left and right step along a row of icons, and are
 * the same step as down and up everywhere else.
 */
function nextOption(key: string, at: number, count: number): number | null {
  switch (key) {
    case 'ArrowDown':
    case 'ArrowRight':
      return (at + 1) % count
    case 'ArrowUp':
    case 'ArrowLeft':
      return at <= 0 ? count - 1 : at - 1
    case 'Home':
      return 0
    case 'End':
      return count - 1
    default:
      return null
  }
}

/**
 * A menu of things to do, opened where the pointer was — what a right-click
 * brings up. It floats at the pointer and closes as a floating panel does
 * (FloatingPanel), and also when an item is chosen or on Tab.
 *
 * Asked for by a tab of the phone's bar it takes the bar's shape instead
 * (BarPanel, UI-66): a panel across the width, rising from the tab, a floating
 * slab dropped over the middle of a phone belonging to neither the list behind
 * it nor the bar that opened it. The things to choose are the same either way.
 */
export function ContextMenu({ place, label, items, fromKeyboard = false, onClose }: ContextMenuProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Tab') {
      event.preventDefault()
      onClose()
      return
    }

    const options = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(ITEMS))
    const next = nextOption(event.key, options.indexOf(document.activeElement as HTMLElement), options.length)
    if (next === null) return

    event.preventDefault()
    options[next].focus()
  }

  const choices = items.map((entry, index) => (
    <Fragment key={index}>
      {/* A group is set off by a line from whatever is next to it, on either side. */}
      {index > 0 && (isGrouped(entry) || isGrouped(items[index - 1])) && (
        <div role="separator" className="my-0.5 border-t border-neutral-200 dark:border-neutral-800" />
      )}
      <MenuEntry entry={entry} onClose={onClose} />
    </Fragment>
  ))

  // Opened from the keyboard it starts on its first item; by a pointer nothing is
  // picked out, and the arrow keys start from the top.
  const focusFirst = fromKeyboard ? ITEMS : undefined

  if (place.at === 'bar') {
    return (
      <BarPanel
        top={place.top}
        role="menu"
        label={label}
        focusFirst={focusFirst}
        onClose={onClose}
        onKeyDown={handleKeyDown}
      >
        {choices}
      </BarPanel>
    )
  }

  return (
    <FloatingPanel
      x={place.x}
      y={place.y}
      align={place.align ?? 'left'}
      role="menu"
      label={label}
      focusFirst={focusFirst}
      onClose={onClose}
      onKeyDown={handleKeyDown}
      // A long run of choices scrolls inside it rather than running off the window.
      // On a phone it is wider, so the larger items (UI-49) have room for their names.
      className="max-w-[min(22rem,calc(100vw-1.5rem))] min-w-64 overflow-y-auto md:max-w-72 md:min-w-40"
    >
      {choices}
    </FloatingPanel>
  )
}

/** One entry of the menu: an item, one with items under it, a group of them, or a row of icons. */
function MenuEntry({ entry, onClose }: { entry: ContextMenuEntry; onClose: () => void }) {
  if ('icons' in entry) {
    return (
      <div role="group" aria-label={entry.group} className={group}>
        <p aria-hidden="true" className={heading}>
          {entry.group}
        </p>
        <div className={panelIconRow}>
          {entry.icons.map((choice, at) => (
            <MenuIcon key={at} {...choice} onClose={onClose} />
          ))}
        </div>
      </div>
    )
  }

  if ('under' in entry) {
    const { under, ...head } = entry
    return (
      <div role="group" aria-label={entry.label} className={group}>
        {/* The head names the group already; it is a choice of its own all the same. */}
        <MenuItem {...head} onClose={onClose} />
        {under.map((choice, at) => (
          <MenuItem key={at} {...choice} indented onClose={onClose} />
        ))}
      </div>
    )
  }

  if ('group' in entry) {
    return (
      <div role="group" aria-label={entry.group} className={group}>
        {/* The group's name is its label already; this is the same words for the eye. */}
        <p aria-hidden="true" className={heading}>
          {entry.group}
        </p>
        {entry.items.map((choice, at) => (
          <MenuItem key={at} {...choice} onClose={onClose} />
        ))}
      </div>
    )
  }

  return <MenuItem {...entry} onClose={onClose} />
}

function MenuItem({
  label,
  onSelect,
  checked,
  toggled,
  icon,
  indented = false,
  onClose,
}: ContextMenuItem & { indented?: boolean; onClose: () => void }) {
  const look = indented ? subItem : item
  // One of a set is ticked; a mark that is on or off is tinted, and so starts
  // where the actions beside it start, with no tick's column before its glyph.
  const on = checked === true || toggled === true
  return (
    <button
      type="button"
      role={checked !== undefined ? 'menuitemradio' : toggled !== undefined ? 'menuitemcheckbox' : 'menuitem'}
      aria-checked={checked ?? toggled}
      onClick={() => {
        onClose()
        onSelect()
      }}
      className={on ? `${look} ${panelOptionOn}` : `${look} ${itemOff}`}
    >
      {checked !== undefined && (
        <span aria-hidden="true" className="w-5 shrink-0 md:w-3">
          {checked ? '✓' : ''}
        </span>
      )}
      {icon !== undefined && (
        <span aria-hidden="true" className={toggled === true ? itemIcon : `${itemIcon} ${itemIconOff}`}>
          {icon}
        </span>
      )}
      <span className="min-w-0 truncate">{label}</span>
    </button>
  )
}

function MenuIcon({ label, hint, icon, onSelect, checked, onClose }: ContextMenuIcon & { onClose: () => void }) {
  return (
    <button
      type="button"
      role={checked === undefined ? 'menuitem' : 'menuitemradio'}
      aria-checked={checked}
      aria-label={label}
      title={hint ?? label}
      onClick={() => {
        onClose()
        onSelect()
      }}
      className={checked === true ? `${iconItem} ${panelIconOn}` : `${iconItem} ${iconOff}`}
    >
      {icon}
    </button>
  )
}

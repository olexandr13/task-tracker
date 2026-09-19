import { Fragment, type KeyboardEvent, type ReactNode } from 'react'
import {
  panelHeading as heading,
  panelIcon,
  panelIconOff,
  panelIconOn,
  panelIconRow,
  panelItem,
  panelOptionOn,
} from '../panelControls'
import { FloatingPanel } from './FloatingPanel'

export interface ContextMenuItem {
  label: string
  onSelect: () => void
  /**
   * For one of a set to choose between: whether it is the one chosen, which is
   * marked and heard as a choice rather than an action. Left out for an action.
   */
  checked?: boolean
}

/** Items that belong together, under a heading of their own and set off from the rest by a line. */
export interface ContextMenuGroup {
  group: string
  items: readonly ContextMenuItem[]
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

export type ContextMenuEntry = ContextMenuItem | ContextMenuGroup | ContextMenuIconGroup

interface ContextMenuProps {
  /** Where it was asked for, in window pixels. */
  x: number
  y: number
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
const ITEMS = '[role="menuitem"], [role="menuitemradio"]'

const item = `${panelItem} whitespace-nowrap transition-colors hover:bg-neutral-100 focus-visible:bg-neutral-100 focus-visible:outline-none dark:hover:bg-neutral-800 dark:focus-visible:bg-neutral-800`
const itemOff =
  'text-neutral-700 hover:text-neutral-900 focus-visible:text-neutral-900 dark:text-neutral-200 dark:hover:text-neutral-100 dark:focus-visible:text-neutral-100'
const iconItem = `${panelIcon} focus-visible:bg-neutral-100 focus-visible:outline-none dark:focus-visible:bg-neutral-800`
const iconOff = `${panelIconOff} focus-visible:text-neutral-900 dark:focus-visible:text-neutral-100`
const group = 'flex flex-col gap-0.5'

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
 */
export function ContextMenu({ x, y, label, items, fromKeyboard = false, onClose }: ContextMenuProps) {
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

  return (
    <FloatingPanel
      x={x}
      y={y}
      role="menu"
      label={label}
      // Opened from the keyboard it starts on its first item; by a pointer nothing is
      // picked out, and the arrow keys start from the top.
      focusFirst={fromKeyboard ? ITEMS : undefined}
      onClose={onClose}
      onKeyDown={handleKeyDown}
      // A long run of choices scrolls inside it rather than running off the window.
      className="max-w-72 min-w-40 overflow-y-auto"
    >
      {items.map((entry, index) => (
        <Fragment key={index}>
          {/* A group is set off by a line from whatever is next to it, on either side. */}
          {index > 0 && ('group' in entry || 'group' in items[index - 1]) && (
            <div role="separator" className="my-0.5 border-t border-neutral-200 dark:border-neutral-800" />
          )}
          <MenuEntry entry={entry} onClose={onClose} />
        </Fragment>
      ))}
    </FloatingPanel>
  )
}

/** One entry of the menu: an item, a group of them, or a row of icons. */
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

function MenuItem({ label, onSelect, checked, onClose }: ContextMenuItem & { onClose: () => void }) {
  return (
    <button
      type="button"
      role={checked === undefined ? 'menuitem' : 'menuitemradio'}
      aria-checked={checked}
      onClick={() => {
        onClose()
        onSelect()
      }}
      className={checked === true ? `${item} ${panelOptionOn}` : `${item} ${itemOff}`}
    >
      {checked !== undefined && (
        <span aria-hidden="true" className="w-3 shrink-0">
          {checked ? '✓' : ''}
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

import { useEffect, useEffectEvent, useLayoutEffect, useRef, type KeyboardEvent, type SyntheticEvent } from 'react'
import { panelItem } from '../panelControls'

export interface ContextMenuItem {
  label: string
  onSelect: () => void
}

interface ContextMenuProps {
  /** Where it was asked for, in window pixels. */
  x: number
  y: number
  /** What the menu is for, when there could be more than one on screen. */
  label: string
  items: readonly ContextMenuItem[]
  /**
   * Whether it was opened from the keyboard, which puts focus on its first item.
   * Opened by a pointer nothing is picked out, and the arrow keys start from the top.
   */
  fromKeyboard?: boolean
  onClose: () => void
}

/** How close to the window's edge the menu may come. */
const margin = 8

const item = `${panelItem} whitespace-nowrap text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:bg-neutral-100 focus-visible:text-neutral-900 focus-visible:outline-none dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 dark:focus-visible:bg-neutral-800 dark:focus-visible:text-neutral-100`

/**
 * Nothing inside the menu reaches whatever holds it: a click on an item is not a
 * click on the row, and focus moving into the menu is not focus on the row.
 */
function keepInside(event: SyntheticEvent) {
  event.stopPropagation()
}

/** Which item a key moves to, round from the last to the first and back; null for a key that moves nothing. */
function nextOption(key: string, at: number, count: number): number | null {
  switch (key) {
    case 'ArrowDown':
      return (at + 1) % count
    case 'ArrowUp':
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
 * brings up. It opens with its corner at the pointer, and on the other side of
 * it where the window runs out.
 *
 * It closes when an item is chosen, on Escape or Tab, on a click outside it, and
 * when the page scrolls or the window changes size, since it would then be left
 * floating away from what it was opened on. Focus goes back to where it was.
 */
export function ContextMenu({ x, y, label, items, fromKeyboard = false, onClose }: ContextMenuProps) {
  const root = useRef<HTMLDivElement>(null)
  // The listeners below are set up once, not again on every render of whatever holds the menu.
  const close = useEffectEvent(onClose)

  useLayoutEffect(() => {
    const menu = root.current
    if (menu === null) return

    const { width, height } = menu.getBoundingClientRect()
    menu.style.left = `${String(x + width > window.innerWidth - margin ? Math.max(margin, x - width) : x)}px`
    menu.style.top = `${String(y + height > window.innerHeight - margin ? Math.max(margin, y - height) : y)}px`
  }, [x, y])

  useLayoutEffect(() => {
    const menu = root.current
    const previous = document.activeElement
    // Into the menu either way, so the arrow keys and Escape work straight away.
    const start = fromKeyboard ? menu?.querySelector<HTMLElement>('[role="menuitem"]') : menu
    start?.focus({ preventScroll: true })

    return () => {
      if (menu?.contains(document.activeElement) === true && previous instanceof HTMLElement) {
        previous.focus({ preventScroll: true })
      }
    }
  }, [fromKeyboard])

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) close()
    }

    function handleMove() {
      close()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    // Capturing, so a scroll inside any part of the page counts too.
    window.addEventListener('scroll', handleMove, true)
    window.addEventListener('resize', handleMove)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('scroll', handleMove, true)
      window.removeEventListener('resize', handleMove)
    }
  }, [])

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    event.stopPropagation()

    if (event.key === 'Escape' || event.key === 'Tab') {
      event.preventDefault()
      onClose()
      return
    }

    const options = Array.from(root.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
    const next = nextOption(event.key, options.indexOf(document.activeElement as HTMLElement), options.length)
    if (next === null) return

    event.preventDefault()
    options[next].focus()
  }

  return (
    <div
      ref={root}
      role="menu"
      aria-label={label}
      tabIndex={-1}
      style={{ left: x, top: y }}
      onKeyDown={handleKeyDown}
      onClick={keepInside}
      onMouseDown={keepInside}
      onTouchStart={keepInside}
      onFocus={keepInside}
      onBlur={keepInside}
      onContextMenu={(event) => {
        event.preventDefault()
        event.stopPropagation()
      }}
      className="fixed z-30 flex min-w-40 focus:outline-none flex-col gap-0.5 rounded-xl border border-neutral-200 bg-white p-1 shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
    >
      {items.map(({ label, onSelect }) => (
        <button
          key={label}
          type="button"
          role="menuitem"
          onClick={() => {
            onClose()
            onSelect()
          }}
          className={item}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

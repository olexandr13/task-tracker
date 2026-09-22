import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type ReactNode,
  type SyntheticEvent,
} from 'react'

interface FloatingPanelProps {
  /** Where it was asked for, in window pixels. */
  x: number
  y: number
  /** What of the panel sits at x: its left edge, its right edge, or its middle. */
  align?: 'left' | 'right' | 'center'
  role: 'menu' | 'dialog'
  /** What the panel is for, when there could be more than one on screen. */
  label: string
  /** What takes focus as it opens: the first element inside matching this, or the panel itself. */
  focusFirst?: string
  onClose: () => void
  /** Keys it does not handle itself. Escape it does: it closes. */
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void
  /** Its size, and what it does with more than fits. */
  className?: string
  children: ReactNode
}

/** How close to the window's edge the panel may come. */
const margin = 8

/**
 * Nothing inside the panel reaches whatever holds it: a click in it is not a
 * click on the row, and focus moving into it is not focus on the row.
 */
function keepInside(event: SyntheticEvent) {
  event.stopPropagation()
}

/**
 * A panel floating over the page at a point — where a right-click was. It opens
 * with its corner at the point, and on the other side of it where the window
 * runs out; or centred on the point, moved in as far as the window needs.
 *
 * It closes on Escape, on a click outside it, and when the page scrolls or the
 * window changes size, since it would then be left floating away from what it
 * was opened on. Focus goes back to where it was.
 */
export function FloatingPanel({
  x,
  y,
  align = 'left',
  role,
  label,
  focusFirst,
  onClose,
  onKeyDown,
  className = '',
  children,
}: FloatingPanelProps) {
  const root = useRef<HTMLDivElement>(null)
  // The listeners below are set up once, not again on every render of whatever holds the panel.
  const close = useEffectEvent(onClose)

  useLayoutEffect(() => {
    const panel = root.current
    if (panel === null) return

    const { width, height } = panel.getBoundingClientRect()
    const lastLeft = window.innerWidth - margin - width
    panel.style.left =
      align === 'right'
        ? `${String(Math.max(margin, Math.min(x - width, lastLeft)))}px`
        : align === 'center'
          ? `${String(Math.max(margin, Math.min(x - width / 2, lastLeft)))}px`
          : `${String(x + width > window.innerWidth - margin ? Math.max(margin, x - width) : x)}px`
    panel.style.top = `${String(y + height > window.innerHeight - margin ? Math.max(margin, y - height) : y)}px`
  }, [x, y, align])

  useLayoutEffect(() => {
    const panel = root.current
    const previous = document.activeElement
    // Into the panel either way, so its keys and Escape work straight away.
    const start = focusFirst === undefined ? panel : (panel?.querySelector<HTMLElement>(focusFirst) ?? panel)
    start?.focus({ preventScroll: true })

    return () => {
      if (panel?.contains(document.activeElement) === true && previous instanceof HTMLElement) {
        previous.focus({ preventScroll: true })
      }
    }
  }, [focusFirst])

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) close()
    }

    // A long panel scrolls inside itself; only the page moving leaves it behind.
    function handleScroll(event: Event) {
      if (!root.current?.contains(event.target as Node)) close()
    }

    function handleResize() {
      close()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    // Capturing, so a scroll inside any part of the page counts too.
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleResize)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    event.stopPropagation()

    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }
    onKeyDown?.(event)
  }

  return (
    <div
      ref={root}
      role={role}
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
      // Never taller than the window.
      className={`fixed z-30 flex max-h-[calc(100dvh-16px)] flex-col gap-0.5 rounded-xl border border-neutral-200 bg-white p-1 shadow-xl focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 ${className}`}
    >
      {children}
    </div>
  )
}

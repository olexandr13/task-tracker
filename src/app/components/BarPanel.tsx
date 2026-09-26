import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { useSheetDrag } from '../useSheetDrag'

interface BarPanelProps {
  /** The top edge of the bar it rises from, in window pixels: where the panel ends. */
  top: number
  role: 'menu' | 'dialog'
  /** What the panel is for, when there could be more than one on screen. */
  label: string
  /** What takes focus as it opens: the first element inside matching this, or the panel itself. */
  focusFirst?: string
  onClose: () => void
  /** Keys it does not handle itself. Escape it does: it closes. */
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void
  children: ReactNode
}

/** How far the panel is pulled down before the page above it is as bright as it gets. */
const UNDIM_DISTANCE = 300

/**
 * A panel that rises from the top edge of the phone's bottom bar and fills the
 * width above it (UI-66) — what a tab's menu opens into.
 *
 * It stops at the bar rather than covering it, so the tab it belongs to is still
 * there and still marked; the page above it is dimmed instead, which both says
 * the panel is the thing to answer and leaves somewhere plain to tap it away. It
 * closes on that dimming, on Escape, pulled down by its handle — which a tap
 * closes too, so a screen reader has a button for it — and on a tap on the bar,
 * the one part of the screen it leaves alone.
 */
export function BarPanel({ top, role, label, focusFirst, onClose, onKeyDown, children }: BarPanelProps) {
  // The whole of the screen above the bar: what is inside the panel, and the dimming
  // beside it. Only the bar is outside.
  const area = useRef<HTMLDivElement>(null)
  const sheet = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const drag = useSheetDrag(sheet, onClose)
  // The listeners below are set up once, not again on every render of whatever holds the panel.
  const close = useEffectEvent(onClose)

  useLayoutEffect(() => {
    const inside = sheet.current
    const previous = document.activeElement
    // Into the panel either way, so its keys and Escape work straight away.
    const start = focusFirst === undefined ? panel.current : (panel.current?.querySelector<HTMLElement>(focusFirst) ?? panel.current)
    start?.focus({ preventScroll: true })

    return () => {
      if (inside?.contains(document.activeElement) === true && previous instanceof HTMLElement) {
        previous.focus({ preventScroll: true })
      }
    }
  }, [focusFirst])

  useLayoutEffect(() => {
    // The page behind is for reading, not for scrolling, while the panel is over it.
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = overflow }
  }, [])

  useEffect(() => {
    // Everything but the bar is covered; this is the tap on the bar itself.
    function handlePointerDown(event: PointerEvent) {
      if (!area.current?.contains(event.target as Node)) close()
    }

    // The bar moves with the window, and the panel is placed against where it was.
    function handleResize() {
      close()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('resize', handleResize)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
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

  return createPortal(
    <div ref={area} className="fixed inset-x-0 top-0 z-30 flex flex-col justify-end" style={{ height: top }}>
      {/* Always a strip of it left, however long the panel runs, so there is somewhere to tap. */}
      <div
        className="sheet-dim-enter min-h-16 flex-1 touch-none bg-black/40 transition-opacity dark:bg-black/60"
        // Pulled down, the page above brightens as the panel goes.
        style={drag.pull > 0 ? { opacity: Math.max(0.2, 1 - drag.pull / UNDIM_DISTANCE) } : undefined}
        onClick={onClose}
      />
      <div
        ref={sheet}
        // Pulled down, it follows the finger, and eases back if let go too soon.
        style={{
          transform: drag.pull > 0 ? `translate3d(0, ${String(drag.pull)}px, 0)` : undefined,
          transition: drag.dragging ? 'none' : 'transform 200ms ease-out',
        }}
        className="sheet-enter flex min-h-0 flex-col rounded-t-2xl border-t border-neutral-200 bg-white pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] shadow-[0_-0.5rem_1.5rem_rgba(0,0,0,0.18)] dark:border-neutral-700 dark:bg-neutral-900"
      >
        {/* The handle: pulled down it takes the panel with it; tapped, it closes it. It sits
            outside the menu itself, which holds nothing but the things to choose. */}
        <button
          type="button"
          aria-label="Close"
          onClick={() => {
            if (!drag.takePulled()) onClose()
          }}
          {...drag.handlers}
          className="flex h-7 w-full shrink-0 cursor-grab touch-none items-center justify-center rounded-t-2xl outline-offset-[-2px] focus-visible:outline-2 focus-visible:outline-blue-500 active:cursor-grabbing"
        >
          <span aria-hidden="true" className="h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-600" />
        </button>
        <div
          ref={panel}
          role={role}
          aria-label={label}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          className="flex min-h-0 flex-col gap-1 overflow-y-auto overscroll-contain px-2 pb-2 focus:outline-none"
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}

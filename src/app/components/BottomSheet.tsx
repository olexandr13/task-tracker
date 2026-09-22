import { useLayoutEffect, useRef, type KeyboardEvent, type ReactNode, type SyntheticEvent } from 'react'
import { createPortal } from 'react-dom'
import { useSheetDrag } from '../useSheetDrag'

interface BottomSheetProps {
  /** What the sheet is for, when there could be more than one on screen. */
  label: string
  onClose: () => void
  children: ReactNode
}

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** How far the sheet is pulled down before the page behind it is as bright as it gets. */
const UNDIM_DISTANCE = 400

function keepInside(event: SyntheticEvent) {
  event.stopPropagation()
}

/**
 * A panel that slides up from the bottom of the screen, covering the phone's
 * bar. The page behind it is dimmed and does not scroll. It closes on a tap on
 * that dimming, on Escape, or pulled down by its handle — which a tap closes too,
 * so a screen reader has a button for it (UI-48). On a wide screen it is a
 * dialog in the middle of the window instead, as wide as its contents need
 * rather than the whole screen (UI-54).
 */
export function BottomSheet({ label, onClose, children }: BottomSheetProps) {
  const root = useRef<HTMLDivElement>(null)
  const drag = useSheetDrag(root, onClose)

  useLayoutEffect(() => {
    const previous = document.activeElement
    // Into the sheet, so its keys and Escape work straight away.
    root.current?.focus({ preventScroll: true })

    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = overflow
      if (previous instanceof HTMLElement) previous.focus({ preventScroll: true })
    }
  }, [])

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      onClose()
      return
    }

    if (event.key !== 'Tab' || root.current === null) return

    const nodes = [...root.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (node) => node.tabIndex !== -1 && node.getClientRects().length > 0,
    )
    const first = nodes[0]
    const last = nodes[nodes.length - 1]
    if (first === undefined || last === undefined) {
      event.preventDefault()
      return
    }

    const at = document.activeElement
    if (event.shiftKey && (at === first || at === root.current)) {
      event.preventDefault()
      last.focus()
      return
    }
    if (!event.shiftKey && at === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-end md:items-center md:justify-center md:p-6" onClick={keepInside}>
      <div
        className="sheet-dim-enter absolute inset-0 bg-black/40 transition-opacity dark:bg-black/60"
        // Pulled down, the page behind brightens as the sheet goes.
        style={drag.pull > 0 ? { opacity: Math.max(0.2, 1 - drag.pull / UNDIM_DISTANCE) } : undefined}
        onClick={onClose}
      />
      <div
        ref={root}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        // Pulled down, it follows the finger, and eases back if let go too soon.
        style={{
          transform: drag.pull > 0 ? `translate3d(0, ${String(drag.pull)}px, 0)` : undefined,
          transition: drag.dragging ? 'none' : 'transform 200ms ease-out',
        }}
        className="sheet-enter relative flex max-h-[90dvh] w-full flex-col rounded-t-2xl border border-neutral-200 bg-white pr-[env(safe-area-inset-right)] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[env(safe-area-inset-left)] shadow-xl outline-none md:max-h-[calc(100dvh-3rem)] md:max-w-lg md:rounded-2xl md:pt-3 md:pr-0 md:pb-3 md:pl-0 dark:border-neutral-700 dark:bg-neutral-900"
      >
        {/* The handle: pulled down it takes the sheet with it; tapped, it closes it. A wide
            screen's dialog has no handle — Escape or a click outside closes it. */}
        <button
          type="button"
          aria-label="Close"
          onClick={() => {
            if (!drag.takePulled()) onClose()
          }}
          {...drag.handlers}
          className="flex h-7 w-full shrink-0 cursor-grab touch-none items-center justify-center rounded-t-2xl outline-offset-[-2px] focus-visible:outline-2 focus-visible:outline-blue-500 active:cursor-grabbing md:hidden"
        >
          <span aria-hidden="true" className="h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-600" />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  )
}

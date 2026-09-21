import { useLayoutEffect, useRef, type KeyboardEvent, type ReactNode, type SyntheticEvent } from 'react'
import { createPortal } from 'react-dom'

interface BottomSheetProps {
  /** What the sheet is for, when there could be more than one on screen. */
  label: string
  onClose: () => void
  children: ReactNode
}

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

function keepInside(event: SyntheticEvent) {
  event.stopPropagation()
}

/**
 * A panel that slides up from the bottom of the screen, covering the phone's
 * bar. The page behind it is dimmed and does not scroll. It closes on a tap on
 * that dimming, or on Escape.
 */
export function BottomSheet({ label, onClose, children }: BottomSheetProps) {
  const root = useRef<HTMLDivElement>(null)

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
    <div className="fixed inset-0 z-40" onClick={keepInside}>
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={onClose} />
      <div
        ref={root}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="absolute inset-x-0 bottom-0 flex max-h-[90dvh] flex-col rounded-t-2xl border border-neutral-200 bg-white pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-xl outline-none dark:border-neutral-700 dark:bg-neutral-900"
      >
        <div className="flex shrink-0 justify-center pt-2 pb-1" aria-hidden="true">
          <div className="h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-600" />
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

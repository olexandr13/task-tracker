import { useEffect, useEffectEvent, useState, type ReactNode, type RefObject } from 'react'
import { panelScrollMargin } from '../panelControls'
import { usePanelPlacement } from '../usePanelPlacement'
import { BottomSheet } from './BottomSheet'

interface PickerPanelProps {
  /** The control the panel belongs to: what it opens beside, and what a click in is not outside. */
  anchor: RefObject<HTMLElement | null>
  /** What the panel is for, when there could be more than one on screen. */
  label: string
  /** Which edge of the button it lines up with as an aside: the one nearer the middle of the screen. */
  align?: 'left' | 'right'
  /** How wide it is as an aside. A sheet is as wide as the screen gives it. */
  width?: string
  /** How its contents are spaced, which is the same whichever shape it takes. */
  content?: string
  /** What it is showing, where that changes its size: it is placed again as this changes. */
  showing?: unknown
  /** A click outside it, Escape, or — as a sheet — its backdrop or a pull down. */
  onClose: () => void
  children: ReactNode
}

/**
 * What a picker opens: the date, the list, the time, the tags, the reward.
 *
 * Beside its button it is a small aside that hangs off the row, kept inside the
 * window's gutter and brought into view (UI-40). Opened from **inside a sheet**
 * it is a sheet of its own instead, over the one it came from: a sheet is only
 * as tall as what it holds, so an aside dropped inside it would be cut off at
 * the sheet's edge with no room to scroll to the rest (UI-64).
 *
 * Which of the two it is, is not the caller's to say — it is where the control
 * ended up, so the panel reads that off the page as it opens.
 */
export function PickerPanel({
  anchor,
  label,
  align = 'right',
  width = '',
  content = '',
  showing,
  onClose,
  children,
}: PickerPanelProps) {
  // Read once, as it opens: a control does not move in or out of a sheet while open.
  const [asSheet] = useState(() => anchor.current?.closest('[aria-modal="true"]') != null)
  const panel = usePanelPlacement(!asSheet, showing)
  // Listened for once, not again on every render of whatever holds the panel: a row
  // rests on the same click that closes the panel, and were this listener taken off
  // and put back as that render went by, the click would be over before it heard it.
  const close = useEffectEvent(onClose)

  useEffect(() => {
    // A sheet has a backdrop of its own; this is the aside, which has nothing between
    // it and the page, so a click anywhere but on it or its control closes it.
    if (asSheet) return

    function handlePointerDown(event: PointerEvent) {
      if (!anchor.current?.contains(event.target as Node)) close()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => { document.removeEventListener('pointerdown', handlePointerDown) }
  }, [asSheet, anchor])

  if (asSheet) {
    return (
      <BottomSheet label={label} onClose={onClose}>
        <div className={`flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-2 ${content}`}>
          {children}
        </div>
      </BottomSheet>
    )
  }

  return (
    <div
      ref={panel}
      role="dialog"
      aria-label={label}
      className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} z-10 mt-1.5 flex flex-col rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900 ${width} ${content} ${panelScrollMargin}`}
    >
      {children}
    </div>
  )
}

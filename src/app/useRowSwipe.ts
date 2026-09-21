import { useEffect, useRef, useState, type RefObject, type TouchEvent as ReactTouchEvent } from 'react'
import {
  clampSwipeOffset,
  lockSwipeAxis,
  swipeActionAt,
  type SwipeAxis,
} from './rowSwipe'

interface RowSwipeActions {
  onComplete: () => void
  onDelete: () => void
}

interface RowSwipe {
  /** How far the row content is slid, in pixels. Positive is complete; negative is delete. */
  offset: number
  /** Whether a swipe is mid-gesture (no snap transition yet). */
  dragging: boolean
  onTouchStart: (event: ReactTouchEvent) => void
  onTouchEnd: (event: ReactTouchEvent) => void
  onTouchCancel: () => void
  /**
   * Swallow the click that ends a horizontal swipe, so the row does not open
   * after an action or a snap-back.
   */
  onClickCapture: (event: { preventDefault: () => void; stopPropagation: () => void }) => void
}

/**
 * Horizontal swipe on a phone's task row: right to complete, left to delete.
 * Vertical movement is left alone so the list still scrolls; a hold-to-drag
 * (dnd-kit) still wins when the finger barely moves before the drag delay.
 */
export function useRowSwipe(
  enabled: boolean,
  element: RefObject<HTMLElement | null>,
  { onComplete, onDelete }: RowSwipeActions,
): RowSwipe {
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)

  const start = useRef<{ x: number; y: number } | null>(null)
  const axis = useRef<SwipeAxis | null>(null)
  const offsetRef = useRef(0)
  const suppressClick = useRef(false)

  function reset() {
    start.current = null
    axis.current = null
    offsetRef.current = 0
    setOffset(0)
    setDragging(false)
  }

  useEffect(() => {
    const node = element.current
    if (!enabled || node === null) return

    function handleTouchMove(event: TouchEvent) {
      if (start.current === null) return
      const touch = event.touches[0]
      if (touch === undefined) return

      const dx = touch.clientX - start.current.x
      const dy = touch.clientY - start.current.y

      if (axis.current === null) {
        const locked = lockSwipeAxis(dx, dy)
        if (locked === null) return
        axis.current = locked
        if (locked === 'vertical') {
          // Scroll owns this gesture; stop tracking.
          start.current = null
          return
        }
        setDragging(true)
      }

      if (axis.current !== 'horizontal') return

      // Stop the page scrolling once this is a row action.
      event.preventDefault()
      const next = clampSwipeOffset(dx)
      offsetRef.current = next
      setOffset(next)
      suppressClick.current = true
    }

    node.addEventListener('touchmove', handleTouchMove, { passive: false })
    return () => { node.removeEventListener('touchmove', handleTouchMove) }
  }, [enabled, element])

  // When swipe is off (wide screen, sheet open, or a drag), the face must sit still.
  const shownOffset = enabled ? offset : 0
  const shownDragging = enabled && dragging

  return {
    offset: shownOffset,
    dragging: shownDragging,
    onTouchStart(event) {
      if (!enabled) return
      const touch = event.touches[0]
      if (touch === undefined) return
      start.current = { x: touch.clientX, y: touch.clientY }
      axis.current = null
      offsetRef.current = 0
      setOffset(0)
      setDragging(false)
    },
    onTouchEnd() {
      if (!enabled || start.current === null) {
        if (offsetRef.current !== 0 || dragging) reset()
        else {
          start.current = null
          axis.current = null
        }
        return
      }

      const action = axis.current === 'horizontal' ? swipeActionAt(offsetRef.current) : null
      if (action !== null) {
        suppressClick.current = true
        if (action === 'complete') onComplete()
        else onDelete()
      } else if (axis.current === 'horizontal') {
        suppressClick.current = true
      }

      reset()
    },
    onTouchCancel: reset,
    onClickCapture(event) {
      if (!suppressClick.current) return
      suppressClick.current = false
      event.preventDefault()
      event.stopPropagation()
    },
  }
}

import { useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'
import { closesSheet, SHEET_TAP_SLOP, sheetPull } from './sheetDrag'

interface SheetDrag {
  /** How far the sheet is pulled down, in pixels. */
  pull: number
  /** Whether a finger is holding it, so it follows without easing. */
  dragging: boolean
  /** For the handle the sheet is pulled by. */
  handlers: {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void
    onPointerCancel: () => void
  }
  /**
   * Whether the click ending this press closed a pull rather than being a tap,
   * so the handle does not also act on it. Asking forgets it.
   */
  takePulled: () => boolean
}

/**
 * A sheet pulled down by its handle (UI-48): it follows the finger, closes when
 * let go far enough down or on a flick, and settles back otherwise.
 */
export function useSheetDrag(sheet: RefObject<HTMLElement | null>, onClose: () => void): SheetDrag {
  const [pull, setPull] = useState(0)
  const [dragging, setDragging] = useState(false)

  const start = useRef<number | null>(null)
  const last = useRef({ y: 0, at: 0 })
  const speed = useRef(0)
  const pulled = useRef(false)
  const pullRef = useRef(0)

  function settle() {
    start.current = null
    pullRef.current = 0
    setPull(0)
    setDragging(false)
  }

  return {
    pull,
    dragging,
    handlers: {
      onPointerDown(event) {
        if (event.pointerType === 'mouse' && event.button !== 0) return
        start.current = event.clientY
        last.current = { y: event.clientY, at: event.timeStamp }
        speed.current = 0
        pulled.current = false
        // Keep hearing the finger once it leaves the handle, as it will.
        event.currentTarget.setPointerCapture?.(event.pointerId)
      },
      onPointerMove(event) {
        if (start.current === null) return
        const dy = event.clientY - start.current
        if (!pulled.current && Math.abs(dy) < SHEET_TAP_SLOP) return

        pulled.current = true
        const elapsed = event.timeStamp - last.current.at
        if (elapsed > 0) speed.current = (event.clientY - last.current.y) / elapsed
        last.current = { y: event.clientY, at: event.timeStamp }

        pullRef.current = sheetPull(dy)
        setPull(pullRef.current)
        setDragging(true)
      },
      onPointerUp() {
        if (start.current === null) return
        const height = sheet.current?.offsetHeight ?? 0
        const closes = pulled.current && closesSheet(pullRef.current, height, speed.current)
        settle()
        if (closes) onClose()
      },
      onPointerCancel: settle,
    },
    takePulled() {
      const was = pulled.current
      pulled.current = false
      return was
    },
  }
}

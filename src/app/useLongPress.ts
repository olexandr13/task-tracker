import { useEffect, useRef, type MouseEvent, type PointerEvent } from 'react'

/** How long a press has to be held to count as long. */
export const LONG_PRESS_MS = 500

/** How far a held pointer may drift, in pixels, and still be the same press. */
const DRIFT = 10

interface LongPressActions<T extends HTMLElement> {
  /** A tap, a click, or Enter or Space. */
  onPress: () => void
  /**
   * A press held down, a right-click, or the context-menu key or Shift+F10 —
   * `fromKeyboard` for the last two, where no pointer says where it was.
   */
  onLongPress: (element: T, fromKeyboard: boolean) => void
}

/**
 * The handlers that tell a press from a long press on one element. A long press
 * swallows the click that ends it, so holding never does both.
 *
 * A long press is also what a right-click and the context-menu key ask for, the
 * way a phone's long press brings up what a desktop's right-click would.
 */
export function useLongPress<T extends HTMLElement>({ onPress, onLongPress }: LongPressActions<T>) {
  const timer = useRef<number | null>(null)
  const start = useRef<{ x: number; y: number } | null>(null)
  const didLongPress = useRef(false)

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    },
    [],
  )

  function cancel() {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
    start.current = null
  }

  function longPress(element: T, fromKeyboard: boolean) {
    cancel()
    didLongPress.current = true
    onLongPress(element, fromKeyboard)
  }

  return {
    onPointerDown(event: PointerEvent<T>) {
      didLongPress.current = false
      if (event.button !== 0) return

      cancel()
      const element = event.currentTarget
      start.current = { x: event.clientX, y: event.clientY }
      timer.current = window.setTimeout(() => { longPress(element, false) }, LONG_PRESS_MS)
    },
    onPointerMove(event: PointerEvent<T>) {
      if (start.current === null) return
      if (Math.hypot(event.clientX - start.current.x, event.clientY - start.current.y) > DRIFT) cancel()
    },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onContextMenu(event: MouseEvent<T>) {
      event.preventDefault()
      // A press being held is a pointer, whatever the event says (a phone's own
      // long press arrives this way). Otherwise no button pressed is the keyboard.
      const fromKeyboard = start.current === null && event.button !== 2 && event.buttons === 0
      longPress(event.currentTarget, fromKeyboard)
    },
    onClick(event: MouseEvent<T>) {
      // A click from the keyboard (no `detail`) never ends a long press, so a
      // right-click left behind cannot swallow the next Enter.
      const endsLongPress = didLongPress.current && event.detail !== 0
      didLongPress.current = false
      if (!endsLongPress) onPress()
    },
  }
}

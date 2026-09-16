import { useCallback, useEffect, useRef, useState } from 'react'
import type { Task } from '../core'

/** How long the offer to undo a deletion stays on screen. */
const UNDO_WINDOW_MS = 5000

/**
 * The short window in which a deletion can be taken straight back.
 *
 * Nothing is lost when the offer lapses — the task is in the trash either way.
 * This only saves the trip there for the mis-click you notice at once.
 */
export function useUndoToast() {
  const [pending, setPending] = useState<Task | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  /**
   * A second deletion replaces the first rather than stacking one toast on
   * another, so two timers can never cross and leave the offer pointing at a
   * task that is no longer the one just deleted.
   */
  const show = useCallback(
    (task: Task) => {
      clearTimer()
      setPending(task)
      timer.current = setTimeout(() => {
        timer.current = null
        setPending(null)
      }, UNDO_WINDOW_MS)
    },
    [clearTimer],
  )

  const dismiss = useCallback(() => {
    clearTimer()
    setPending(null)
  }, [clearTimer])

  useEffect(() => clearTimer, [clearTimer])

  return { pending, show, dismiss }
}

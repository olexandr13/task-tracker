import { useCallback, useEffect, useRef, useState } from 'react'
import type { Redemption, RewardEntry, Task } from '../core'

/** How long the offer to undo a deletion stays on screen. */
const UNDO_WINDOW_MS = 5000

/**
 * What was just deleted and can be taken straight back: a task (which is in the
 * trash either way), or an earning / redemption (gone for good once the offer
 * lapses).
 */
export type UndoPending =
  | { kind: 'task'; task: Task }
  | { kind: 'earning'; entry: RewardEntry; title: string }
  | { kind: 'redemption'; redemption: Redemption }

/** The name shown on the toast for whatever was just deleted. */
export function undoTitle(pending: UndoPending): string {
  switch (pending.kind) {
    case 'task':
      return pending.task.title
    case 'earning':
      return pending.title
    case 'redemption':
      return pending.redemption.note
  }
}

/**
 * The short window in which a deletion can be taken straight back.
 *
 * For a task, nothing is lost when the offer lapses — it is in the trash either
 * way. For an earning or a redemption, the record is already gone and this is
 * the only chance to put it back. A second deletion replaces the first rather
 * than stacking toasts.
 */
export function useUndoToast() {
  const [pending, setPending] = useState<UndoPending | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current)
    }
    timer.current = null
  }, [])

  /**
   * A second deletion replaces the first rather than stacking one toast on
   * another, so two timers can never cross and leave the offer pointing at
   * something that is no longer the one just deleted.
   */
  const show = useCallback(
    (item: UndoPending) => {
      clearTimer()
      setPending(item)
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

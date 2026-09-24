import { useCallback, useEffect, useRef, useState } from 'react'
import type { PrizeId, Redemption, RewardEntry, Task, TaskId } from '../core'
import { describePoints } from './rewardLabels'

/** How long the offer to undo stays on screen. */
const UNDO_WINDOW_MS = 5000

/**
 * What was just done and can be taken straight back: a deletion (task in the
 * trash, or an earning / redemption gone for good once the offer lapses), a
 * completion (the task stays done if the offer lapses; the toast only reopens
 * it), points just spent (RWD-41), which the toast is also the confirmation
 * of — the row that was redeemed does not change, so without it a click would
 * look like nothing happening — or a repeat ended by a day picked for it
 * (DUE-17), which holds the whole task as it was, the rule alone not being
 * enough to rebuild it.
 */
export type UndoPending =
  | { kind: 'task'; task: Task }
  | { kind: 'earning'; entry: RewardEntry; title: string }
  | { kind: 'redemption'; redemption: Redemption }
  | { kind: 'redeem'; redemption: Redemption; wishId: PrizeId | null }
  | { kind: 'completion'; taskId: TaskId }
  | { kind: 'repeatEnded'; task: Task }

/** What the toast says happened. Completions say nothing: the tick already did. */
export function undoMessage(pending: Exclude<UndoPending, { kind: 'completion' }>): string {
  switch (pending.kind) {
    case 'task':
      return `Deleted “${pending.task.title}”`
    case 'earning':
      return `Deleted “${pending.title}”`
    case 'redemption':
      return `Deleted “${pending.redemption.note}”`
    case 'redeem':
      return `Redeemed “${pending.redemption.note}” for ${describePoints(pending.redemption.points)}`
    case 'repeatEnded':
      return `Ended the repeat on “${pending.task.title}”`
  }
}

/**
 * The short window in which a deletion or a completion can be taken straight back.
 *
 * For a task deletion, nothing is lost when the offer lapses — it is in the trash
 * either way. For an earning or a redemption, the record is already gone and this
 * is the only chance to put it back. For a completion, the task stays done; the
 * toast only saves reopening it by hand. For a repeat ended by a day picked for
 * it, the ticks and sessions of occurrences gone by go with the rule, so this is
 * the only chance to have them back (DUE-17). A second offer replaces the first
 * rather than stacking toasts.
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
   * A second offer replaces the first rather than stacking one toast on
   * another, so two timers can never cross and leave the offer pointing at
   * something that is no longer the one just done.
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

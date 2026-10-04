import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { nextKeyTime, type CaseSettings, type RewardEntry, type Task } from '../core'
import { notifyBrowser } from './browserNotification'
import { CASE_DAILY_NOTICE, CASE_DAILY_NOTICE_BODY } from './caseLabels'

/** What the countdown timer needs to know. */
export interface KeyTimerState {
  /** Milliseconds until the next key, or null when there is nothing to wait for. */
  readonly remainingMs: number | null
  /** Which way the next key comes: 'clear' (no timer) or 'daily' (random time). */
  readonly way: 'clear' | 'daily' | null
  /** The moment the next key arrives, for display. */
  readonly at: Date | null
}

/** Whether to watch for the daily case, and where its notification leads. */
export interface DailyCaseWatch {
  /**
   * False while Cases is switched off or still loading. An arrival then is
   * not said, and turning Cases back on does not announce one that already
   * passed (FEAT-3, CHST-29).
   */
  readonly watching?: boolean
  /** What pressing the browser notification does, after the window is brought forward. */
  readonly onOpen?: () => void
}

export interface KeyTimerControl extends KeyTimerState {
  /**
   * The moment Cases should be read at. The caller's `now`, until the daily
   * case's time is reached while watching — then that moment, so the case
   * becomes ready without waiting for whoever passed `now` to notice.
   */
  readonly now: Date
  /** The daily case's timer ran out while the app was open (CHST-29). */
  readonly notice: boolean
  readonly dismissNotice: () => void
}

/**
 * Watches the daily case's arrival (CHST-28, CHST-29).
 *
 * The countdown on the case ticks on its own. This waits for the moment itself,
 * once, and when it arrives says so — on screen, and as a browser notification
 * where one is allowed. A case whose time has already passed when watching
 * starts is simply ready: opening the app afterwards is not the timer running
 * out.
 */
export function useKeyTimer(
  tasks: readonly Task[],
  entries: readonly RewardEntry[],
  settings: CaseSettings,
  now: Date,
  watch: DailyCaseWatch = {},
): KeyTimerControl {
  const watching = watch.watching ?? true
  const [clock, setClock] = useState(now)
  const [notice, setNotice] = useState(false)
  const onOpenRef = useRef(watch.onOpen)
  useLayoutEffect(() => {
    onOpenRef.current = watch.onOpen
  }, [watch.onOpen])

  // Whoever is asking may be behind the arrival this hook has already seen.
  const moment = now.getTime() >= clock.getTime() ? now : clock
  const next = nextKeyTime(tasks, entries, settings, moment)
  const dueAt = next?.at.getTime() ?? null

  useEffect(() => {
    if (!watching || dueAt === null) return

    // Armed from the wall clock, not from a render's `now`, so a later render
    // does not start the wait over. Already due as watching starts: the case is
    // ready, and was not watched to.
    const left = () => dueAt - Date.now()
    if (left() <= 0) return

    const id = window.setTimeout(() => {
      setClock(new Date(dueAt))
      setNotice(true)
      notifyBrowser(CASE_DAILY_NOTICE, CASE_DAILY_NOTICE_BODY, {
        tag: 'chest-daily',
        onClick: () => {
          setNotice(false)
          onOpenRef.current?.()
        },
      })
    }, left())

    return () => { window.clearTimeout(id) }
  }, [dueAt, watching])

  const dismissNotice = useCallback(() => { setNotice(false) }, [])

  return {
    remainingMs: next === null ? null : Math.max(0, next.at.getTime() - moment.getTime()),
    way: next?.way ?? null,
    at: next?.at ?? null,
    now: moment,
    notice,
    dismissNotice,
  }
}

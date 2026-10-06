import { useCallback, useEffect, useRef, useState } from 'react'
import {
  caseSlots,
  caseBlock,
  caseIdFor,
  caseJackpot,
  caseOpened,
  caseQuarter,
  caseSpan,
  nextShareAt,
  openSpan,
  summarize,
  toLocalDay,
  type CaseSlot,
  type CaseSource,
  type CaseBlock,
  type CaseOpen,
  type CaseQuarter,
  type CaseSettings,
  type CaseSpan,
  type RewardEntry,
  type Task,
} from '../core'
import type { CaseDeviceRepository } from '../storage/caseDeviceRepository'
import { useDeviceSetting } from './useDeviceSetting'
import { useKeyTimer, type DailyCaseWatch, type KeyTimerState } from './useCaseKey'

/** What a screen needs to put Cases in front of someone. */
export interface Cases {
  /** Whether the ledger and the tasks it is measured against have arrived yet. */
  readonly isLoading: boolean
  readonly settings: CaseSettings
  /** Everything earned today, which Today’s case takes half of (CHST-7). */
  readonly jackpot: number
  /** What each case can pay, from the tasks and the ledger as they stand (CHST-10). */
  readonly spans: Readonly<Record<CaseSource, CaseSpan>>
  /** Why there is nothing to open, or null while a key is waiting. */
  readonly blocked: CaseBlock | null
  /** How many tasks Today asked for, which is what `tooSmall` is measured against. */
  readonly dayAsked: number
  /** What today's case gave, or null while it is still shut. */
  readonly opened: RewardEntry | null
  /** Which quarter of the jackpot today's opening came to, where this device saw it happen (CHST-24). */
  readonly lastQuarter: CaseQuarter | null
  readonly sound: boolean
  readonly setSound: (on: boolean) => void
  /** Today's cases: ready, still on the way, or opened and kept until the day ends (CHST-28). */
  readonly slots: readonly CaseSlot[]
  /**
   * Opens one ready case: draws what it gives, writes it, and hands it back
   * for the opening to be drawn. Today's case when none is named. Null while
   * that case is not ready.
   */
  readonly open: (source?: CaseSource) => CaseOpen | null
  readonly setSettings: (settings: CaseSettings) => void
  /** Whether this device has yet to say today that Today's case is waiting (CHST-23). */
  readonly unannounced: boolean
  readonly announce: () => void
  /** The daily case's timer ran out while the app was open (CHST-29). */
  readonly dailyNotice: boolean
  readonly dismissDailyNotice: () => void
  /** Monday, and Weekly is still to open, and this device has not said so yet (CHST-30). */
  readonly shareNotice: boolean
  readonly announceShare: () => void
  /** When the bonus key arrives, while that is what is being waited for. */
  readonly keyTimer: KeyTimerState
}

/** The half of the ledger Cases reads and writes. */
interface Ledger {
  readonly entries: readonly RewardEntry[]
  readonly cases: CaseSettings
  readonly saveEarning: (entry: RewardEntry) => void
  readonly setCaseSettings: (settings: CaseSettings) => void
}

/**
 * Cases as its page reads it: whether a key is waiting, what it plays for,
 * and the one way to open it (CHST-2, CHST-14).
 *
 * **What an opening gives is written before any of it is drawn.** The ledger
 * names an entry by its task and its day, and a pull of the lever is an entry
 * under an id of its own — so it is recorded the moment it is drawn, counted
 * once however many devices see it, and there is nothing a reload in the middle
 * of the reel could draw a second time. The reel is a replay of something that
 * already happened.
 *
 * `tasks` is the live tasks, which is what "everything in Today" is asked of,
 * `accountId` whose Drop moment it is (CHST-29), and `ready` says whether they
 * and the ledger have arrived. **Nothing is
 * answered before they have.** A ledger not read yet reads as a case not
 * opened, which would say a key was waiting over one already spent — and worse,
 * would let an opening write over what the morning's gave, the two being one
 * entry of the ledger. So until both are in, Cases is loading and has
 * nothing to give, as a mode's switch waits rather than guessing (MODE-8).
 */
export function useCases(
  tasks: readonly Task[],
  ledger: Ledger,
  device: CaseDeviceRepository,
  accountId: string,
  now: Date,
  ready: boolean,
  watch: DailyCaseWatch = {},
): Cases {
  const [kept, setKept] = useDeviceSetting(device)

  const settings = ledger.cases
  // While Cases is off, or the ledger has not arrived, the Drop's arrival is
  // not watched: it is not said later (CHST-29, FEAT-3). Weekly's midnight
  // is not watched either; opening the app on Monday still says it (CHST-30).
  const watching = ready && (watch.watching ?? true)
  const keyTimer = useKeyTimer(tasks, ledger.entries, settings, accountId, now, {
    watching,
    onOpen: watch.onOpen,
  })
  // Monday midnight, so Weekly becomes ready while the app is still open on
  // Sunday. Null once Monday has begun: the caller's `now` is already that day.
  const shareDue = nextShareAt(now)?.getTime() ?? null
  const [shareClock, setShareClock] = useState<Date | null>(null)
  useEffect(() => {
    if (!watching || shareDue === null) return
    // Already due as watching starts: the caller's `now` is what the day is,
    // and a Monday that has passed in the wall clock is not this screen's day.
    // The timeout is only for a Monday that arrives while the app stays open.
    const wait = shareDue - Date.now()
    if (wait <= 0) return
    const id = window.setTimeout(() => {
      setShareClock(new Date(shareDue))
    }, wait)
    return () => {
      window.clearTimeout(id)
    }
  }, [watching, shareDue])
  const moment = shareClock !== null && shareClock.getTime() > keyTimer.now.getTime() ? shareClock : keyTimer.now
  const today = toLocalDay(moment)
  const blocked = ready ? caseBlock(tasks, ledger.entries, settings, accountId, moment) : 'unclear'
  const opened = caseOpened(ledger.entries, moment)
  const jackpot = caseJackpot(ledger.entries, moment)
  const spans = {
    today: caseSpan('today', tasks, ledger.entries, settings, moment),
    daily: caseSpan('daily', tasks, ledger.entries, settings, moment),
    week: caseSpan('week', tasks, ledger.entries, settings, moment),
  }
  const dayAsked = summarize(tasks, 'today', moment).total
  const slots = caseSlots(tasks, ledger.entries, settings, accountId, moment)

  // The last opening and the notice both belong to a day, so a day that has
  // turned leaves them behind rather than glowing over this morning's cases.
  const lastQuarter = kept.lastOpen !== null && kept.lastOpen.day === today ? kept.lastOpen.quarter : null

  // What the latest change left, ahead of the render that draws it, so two
  // changes in one go each build on the one before (STORE-39).
  const latest = useRef(kept)
  useEffect(() => {
    latest.current = kept
  }, [kept])

  // The day this screen has already opened, ahead of the ledger saying so. The
  // write goes out and comes back through the subscription, which is a moment
  // later however fast it is; without this, two presses inside that moment would
  // each draw an opening and the second would write over the first, the two
  // being one entry of the ledger (CHST-4).
  const openedHere = useRef<Set<string>>(new Set())

  const open = useCallback((source: CaseSource = 'today'): CaseOpen | null => {
    const day = toLocalDay(moment)
    const mark = `${day}/${source}`
    if (!ready || openedHere.current.has(mark)) return null
    const slot = caseSlots(tasks, ledger.entries, settings, accountId, moment).find((item) => item.source === source)
    if (slot?.state !== 'ready') return null

    const result = openSpan(caseSpan(source, tasks, ledger.entries, settings, moment))
    openedHere.current.add(mark)
    ledger.saveEarning({ taskId: caseIdFor(source), day, points: result.points })
    setKept({ ...latest.current, lastOpen: { day, quarter: caseQuarter(result.points, result.jackpot) } })
    return result
  }, [ready, tasks, ledger, settings, accountId, moment, setKept])

  const setSound = useCallback(
    (on: boolean) => {
      setKept({ ...latest.current, sound: on })
    },
    [setKept],
  )

  const announce = useCallback(() => {
    setKept({ ...latest.current, noticedDay: toLocalDay(moment) })
  }, [setKept, moment])

  const announceShare = useCallback(() => {
    setKept({ ...latest.current, noticedWeek: toLocalDay(moment) })
  }, [setKept, moment])

  const todayReady = slots.some((slot) => slot.source === 'today' && slot.state === 'ready')
  const shareReady = slots.some((slot) => slot.source === 'week' && slot.state === 'ready')

  return {
    isLoading: !ready,
    settings,
    jackpot,
    spans,
    blocked,
    dayAsked,
    opened,
    lastQuarter,
    sound: kept.sound,
    setSound,
    slots,
    open,
    setSettings: ledger.setCaseSettings,
    // Today's case, not the daily one arriving on its clock (CHST-23, CHST-29).
    unannounced: ready && todayReady && kept.noticedDay !== today,
    announce,
    dailyNotice: keyTimer.notice,
    dismissDailyNotice: keyTimer.dismissNotice,
    shareNotice: ready && shareReady && kept.noticedWeek !== today,
    announceShare,
    keyTimer,
  }
}

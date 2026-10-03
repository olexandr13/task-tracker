import { useCallback, useEffect, useRef } from 'react'
import {
  chestBlock,
  chestJackpot,
  chestOpened,
  chestQuarter,
  CHEST_ID,
  openChest,
  summarize,
  toLocalDay,
  type ChestBlock,
  type ChestOpen,
  type ChestQuarter,
  type ChestSettings,
  type RewardEntry,
  type Task,
} from '../core'
import type { ChestDeviceRepository } from '../storage/chestDeviceRepository'
import { useDeviceSetting } from './useDeviceSetting'

/** What a screen needs to put the chest in front of someone. */
export interface Chest {
  /** Whether the ledger and the tasks it is measured against have arrived yet. */
  readonly isLoading: boolean
  readonly settings: ChestSettings
  /** The most this opening could give: everything earned today, as the ledger stands (CHST-7). */
  readonly jackpot: number
  /** Why there is nothing to open, or null while a key is waiting. */
  readonly blocked: ChestBlock | null
  /** How many tasks Today asked for, which is what `tooSmall` is measured against. */
  readonly dayAsked: number
  /** What today's chest gave, or null while it is still shut. */
  readonly opened: RewardEntry | null
  /** Which quarter of the jackpot today's opening came to, where this device saw it happen (CHST-24). */
  readonly lastQuarter: ChestQuarter | null
  readonly sound: boolean
  readonly setSound: (on: boolean) => void
  /**
   * Opens today's chest: draws what it gives, writes it, and hands it back for
   * the opening to be drawn. Null while there is nothing to open.
   */
  readonly open: () => ChestOpen | null
  readonly setSettings: (settings: ChestSettings) => void
  /** Whether this device has yet to say today that a key is waiting (CHST-23). */
  readonly unannounced: boolean
  readonly announce: () => void
}

/** The half of the ledger the chest reads and writes. */
interface Ledger {
  readonly entries: readonly RewardEntry[]
  readonly chest: ChestSettings
  readonly saveEarning: (entry: RewardEntry) => void
  readonly setChestSettings: (settings: ChestSettings) => void
}

/**
 * The chest as its page reads it: whether a key is waiting, what it plays for,
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
 * and `ready` says whether they and the ledger have arrived. **Nothing is
 * answered before they have.** A ledger not read yet reads as a chest not
 * opened, which would say a key was waiting over one already spent — and worse,
 * would let an opening write over what the morning's gave, the two being one
 * entry of the ledger. So until both are in, the chest is loading and has
 * nothing to give, as a mode's switch waits rather than guessing (MODE-8).
 */
export function useChest(
  tasks: readonly Task[],
  ledger: Ledger,
  device: ChestDeviceRepository,
  now: Date,
  ready: boolean,
): Chest {
  const [kept, setKept] = useDeviceSetting(device)

  const settings = ledger.chest
  const today = toLocalDay(now)
  const blocked = ready ? chestBlock(tasks, ledger.entries, settings, now) : 'unclear'
  const opened = chestOpened(ledger.entries, now)
  const jackpot = chestJackpot(ledger.entries, now)
  const dayAsked = summarize(tasks, 'today', now).total

  // The last opening and the notice both belong to a day, so a day that has
  // turned leaves them behind rather than glowing over this morning's chest.
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
  const openedHere = useRef<string | null>(null)

  const open = useCallback((): ChestOpen | null => {
    const day = toLocalDay(now)
    if (!ready || openedHere.current === day) return null
    if (chestBlock(tasks, ledger.entries, settings, now) !== null) return null

    const result = openChest(chestJackpot(ledger.entries, now))
    openedHere.current = day
    ledger.saveEarning({ taskId: CHEST_ID, day, points: result.points })
    setKept({ ...latest.current, lastOpen: { day, quarter: chestQuarter(result.points, result.jackpot) } })
    return result
  }, [ready, tasks, ledger, settings, now, setKept])

  const setSound = useCallback(
    (on: boolean) => {
      setKept({ ...latest.current, sound: on })
    },
    [setKept],
  )

  const announce = useCallback(() => {
    setKept({ ...latest.current, noticedDay: toLocalDay(now) })
  }, [setKept, now])

  return {
    isLoading: !ready,
    settings,
    jackpot,
    blocked,
    dayAsked,
    opened,
    lastQuarter,
    sound: kept.sound,
    setSound,
    open,
    setSettings: ledger.setChestSettings,
    unannounced: ready && blocked === null && kept.noticedDay !== today,
    announce,
  }
}

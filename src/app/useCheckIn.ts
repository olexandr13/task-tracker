import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  isExpectedSlot,
  isSlotLogged,
  pendingCheckIn,
  slotEnd,
  slotJustEnded,
  slotKey,
  CHECK_IN_SEND_MINUTES,
  type ActivityEntry,
  type HoursWindow,
  type PendingCheckIn,
} from '../core'
import type { CheckInDeviceRepository, CheckInDeviceState } from '../storage/checkInDeviceRepository'
import { CHECK_IN_OFF, type CheckInPreference, type CheckInRepository } from '../storage/checkInRepository'
import { askToNotify, notifyBrowser, notifyPermission, type NotifyPermission } from './browserNotification'
import { describeCheckInQuestion } from './checkInLabels'
import { ignoreProblems, type ReportProblem } from './storageProblem'

/**
 * How often the clock is read besides the top of the hour itself: often enough
 * that a laptop woken from sleep catches the hour it slept through.
 */
const TICK_MS = 30 * 1000

/** A moment past the hour, so the hour is over by the time the timer reads the clock. */
const PAST_THE_HOUR_MS = 500

export interface CheckInControl {
  /** Whether the check-in is on, and the hours it asks about — the account's (STORE-52). */
  readonly preference: CheckInPreference
  /** Whether the setting is still on its way from the account (MODE-8). */
  readonly isLoading: boolean
  /** Turning it on asks the browser for permission, once. */
  readonly turnOn: (on: boolean) => void
  /** The hours it asks about, whole hours (CHECKIN-2). */
  readonly changeWindow: (window: HoursWindow) => void
  /** Whether the browser will post notifications, so the mode's page can say when it will not. */
  readonly permission: NotifyPermission
  /** The hour asked about now, or null (CHECKIN-3). */
  readonly notice: PendingCheckIn | null
  /** Puts the notice away on this device, until the next hour asks (CHECKIN-4). */
  readonly dismiss: () => void
  /** What this device keeps of it: the notice dismissed, and its push registration (STORE-54). */
  readonly device: CheckInDeviceState
  readonly updateDevice: (change: (state: CheckInDeviceState) => CheckInDeviceState) => void
}

interface CheckInOptions {
  /** What a notification opens, pressed: the activity log on that hour. */
  readonly onOpen?: (slot: PendingCheckIn['slot']) => void
}

/**
 * The check-in: while it is on, the clock is read at the top of every hour —
 * and every half minute besides — and an hour that has just ended, inside the
 * hours kept to and with nothing logged under it, is asked about (CHECKIN-1):
 * a notice at the foot of the app, derived each render from the log, and a
 * browser notification where one is allowed and the sender does not push one.
 *
 * The setting is the account's and arrives as the other modes' do. What stays
 * on the device is what only the device can answer: the notice dismissed here,
 * and whether this device is pushed check-ins.
 *
 * `entries` is the activity log — null while it is still loading, when an hour
 * with nothing under it is one not read yet rather than one not logged.
 *
 * A load or a save the repository refuses is told to `onProblem` (STORE-13),
 * which is expected to stay the same function from render to render.
 */
export function useCheckIn(
  repository: CheckInRepository,
  deviceRepository: CheckInDeviceRepository,
  entries: readonly ActivityEntry[] | null,
  onProblem: ReportProblem = ignoreProblems,
  { onOpen }: CheckInOptions = {},
): CheckInControl {
  // Boxed, there being nothing to tell a check-in that is off from one not read yet.
  const [saved, setSaved] = useState<{ of: CheckInPreference } | null>(null)
  const [device, setDevice] = useState<CheckInDeviceState>(() => deviceRepository.load())
  const [permission, setPermission] = useState<NotifyPermission>(() => notifyPermission())
  const [clock, setClock] = useState(() => new Date())

  // The end of the stretch already watched: an hour that ended inside it has
  // been announced, or was over before this device started watching.
  const watchedTo = useRef(new Date())
  // The latest of what the clock's effect reads, as of right now rather than as
  // of the render it was set up in.
  // A device the sender pushes check-ins to posts none of its own, so the same
  // hour is not announced twice (CHECKIN-10).
  const live = useRef({ entries, pushed: device.pushOn, onOpen })
  useLayoutEffect(() => {
    live.current = { entries, pushed: device.pushOn, onOpen }
  })

  useEffect(() => {
    return repository.subscribe(
      (preference) => { setSaved({ of: preference ?? CHECK_IN_OFF }) },
      (error) => {
        console.error('Could not load the check-in setting.', error)
        setSaved({ of: CHECK_IN_OFF })
        onProblem('load')
      },
    )
  }, [repository, onProblem])

  const isLoading = saved === null
  const preference = saved?.of ?? CHECK_IN_OFF

  const persist = useCallback(
    (next: CheckInPreference) => {
      setSaved({ of: next })
      repository.save(next).catch((error: unknown) => {
        console.error('Could not save the check-in setting.', error)
        onProblem('save')
      })
    },
    [repository, onProblem],
  )

  const updateDevice = useCallback(
    (change: (state: CheckInDeviceState) => CheckInDeviceState) => {
      setDevice((current) => {
        const next = change(current)
        deviceRepository.save(next)
        return next
      })
    },
    [deviceRepository],
  )

  // The top of every hour, to the second, and a tick besides for a clock that
  // jumped — only while it is on, there being nothing to ask otherwise.
  useEffect(() => {
    if (!preference.on) return
    let timeout: number | undefined
    const schedule = () => {
      const now = new Date()
      const top = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1)
      timeout = window.setTimeout(() => {
        setClock(new Date())
        schedule()
      }, top.getTime() - now.getTime() + PAST_THE_HOUR_MS)
    }
    schedule()
    const interval = window.setInterval(() => { setClock(new Date()) }, TICK_MS)
    return () => {
      window.clearTimeout(timeout)
      window.clearInterval(interval)
    }
  }, [preference.on])

  // An hour that ended while this device was watching is announced once, by a
  // notification, where the sender does not push one here. One that ended
  // before — the app opened afterwards — is left to the notice (CHECKIN-5).
  useEffect(() => {
    const { entries: log, pushed: isPushed, onOpen: open } = live.current
    // Still loading: the stretch is left unspent, so an hour that ended while
    // the log arrived is still announced once it is here.
    if (isLoading || log === null) return

    const since = watchedTo.current
    if (clock.getTime() <= since.getTime()) return
    watchedTo.current = clock

    if (!preference.on || isPushed) return
    const slot = slotJustEnded(clock)
    const ended = slotEnd(slot)
    if (ended.getTime() <= since.getTime()) return
    if (clock.getTime() - ended.getTime() >= CHECK_IN_SEND_MINUTES * 60 * 1000) return
    if (!isExpectedSlot(preference.window, slot) || isSlotLogged(log, slot)) return

    notifyBrowser(describeCheckInQuestion(slot), 'Log it in PickMe’s Activity log.', {
      tag: `check-in-${slotKey(slot)}`,
      onClick: open === undefined ? undefined : () => { open(slot) },
    })
  }, [clock, isLoading, preference])

  const notice =
    isLoading || !preference.on || entries === null
      ? null
      : pendingCheckIn(entries, preference.window, clock, device.dismissedSlot)

  const turnOn = useCallback(
    (on: boolean) => {
      persist({ ...preference, on })
      if (on) void askToNotify().then(setPermission)
    },
    [persist, preference],
  )

  const changeWindow = useCallback(
    (window: HoursWindow) => { persist({ ...preference, window }) },
    [persist, preference],
  )

  const dismiss = useCallback(() => {
    if (notice === null) return
    const dismissedSlot = slotKey(notice.slot)
    updateDevice((current) => ({ ...current, dismissedSlot }))
  }, [notice, updateDevice])

  return {
    preference,
    isLoading,
    turnOn,
    changeWindow,
    permission,
    notice,
    dismiss,
    device,
    updateDevice,
  }
}

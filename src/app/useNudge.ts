import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  findNudge,
  lastFinishedAt,
  nudgeWindowOpenedAt,
  settleNudge,
  type Nudge,
  type NudgeWindow,
  type QuietHours,
  type Task,
} from '../core'
import { NUDGE_UNSPOKEN, type NudgeDeviceRepository, type NudgeDeviceState } from '../storage/nudgeDeviceRepository'
import { NUDGE_OFF, type NudgePreference, type NudgeRepository } from '../storage/nudgeRepository'
import { askToNotify, notifyBrowser, notifyPermission, type NotifyPermission } from './browserNotification'
import { ignoreProblems, type ReportProblem } from './storageProblem'

/** How often the quiet is measured again. A minute is finer than any span offered. */
const TICK_MS = 60 * 1000

export interface NudgeControl {
  /** How the owner asked to be nudged, the account's (STORE-46). */
  readonly preference: NudgePreference
  /** Whether the setting is still on its way from the account (MODE-8). */
  readonly isLoading: boolean
  /** Turning it on asks the browser for permission, once. */
  readonly turnOn: (on: boolean) => void
  readonly changeQuietHours: (hours: QuietHours) => void
  /** The hours it may speak in, or null for any hour (NUDGE-12). */
  readonly changeWindow: (window: NudgeWindow | null) => void
  /** Whether the browser will post notifications, so the mode's page can say when it will not. */
  readonly permission: NotifyPermission
  readonly notice: Nudge | null
  readonly dismiss: () => void
}

/**
 * The nudge: while it is on, the tasks are measured against the clock every
 * minute, and a quiet stretch of the chosen span says so — an on-screen notice,
 * and a browser notification where one is allowed. Inside the hours it is held
 * to, where it is held to any (NUDGE-12).
 *
 * The setting is the account's and arrives as the other modes do, so a span set
 * at the laptop is the span at the phone (STORE-46). What stays on the device
 * is what only the device can answer: when it last spoke here, and the notice
 * it left standing (NUDGE-6).
 *
 * `tasks` is the set in play (Today's) — null while it is still loading, when a
 * quiet app is a loading one rather than an idle owner.
 *
 * A nudge that has fired is kept rather than held on screen alone (NUDGE-6,
 * NUDGE-8): firing spends the quiet stretch, so a notice lost to a refresh or a
 * remount would be a nudge the owner paid for and never saw. What it still has
 * to say is derived from the tasks each render (`settleNudge`), so finishing its
 * task anywhere takes it away.
 *
 * A load or a save the repository refuses is told to `onProblem` (STORE-13),
 * which is expected to stay the same function from render to render.
 */
export function useNudge(
  repository: NudgeRepository,
  device: NudgeDeviceRepository,
  tasks: readonly Task[] | null,
  onProblem: ReportProblem = ignoreProblems,
): NudgeControl {
  // Boxed, there being nothing to tell a nudge that is off from one not read yet.
  const [saved, setSaved] = useState<{ of: NudgePreference } | null>(null)
  const [deviceState, setDeviceState] = useState<NudgeDeviceState>(() => device.load())
  const [permission, setPermission] = useState<NotifyPermission>(() => notifyPermission())
  const [clock, setClock] = useState(() => new Date())

  // When this device started watching. An account with nothing ever finished is
  // measured from here, so a first visit is not hours of quiet on arrival.
  const watchingSince = useRef(new Date())
  // The latest tasks, for the tick to read: the tick runs on the clock, not on
  // every render, and must not see the set as it was when it was set up.
  const tasksRef = useRef(tasks)
  useLayoutEffect(() => {
    tasksRef.current = tasks
  })
  // What this device remembers, as of right now rather than as of this render:
  // the effects below both read and write it within one commit.
  const remembered = useRef(deviceState)

  useEffect(() => {
    return repository.subscribe(
      (preference) => { setSaved({ of: preference ?? NUDGE_OFF }) },
      (error) => {
        console.error('Could not load the nudge setting.', error)
        setSaved({ of: NUDGE_OFF })
        onProblem('load')
      },
    )
  }, [repository, onProblem])

  const isLoading = saved === null
  const preference = saved?.of ?? NUDGE_OFF

  const remember = useCallback(
    (next: NudgeDeviceState) => {
      remembered.current = next
      setDeviceState(next)
      device.save(next)
    },
    [device],
  )

  const persist = useCallback(
    (next: NudgePreference) => {
      setSaved({ of: next })
      repository.save(next).catch((error: unknown) => {
        console.error('Could not save the nudge setting.', error)
        onProblem('save')
      })
    },
    [repository, onProblem],
  )

  useEffect(() => {
    if (!preference.on) return
    const id = window.setInterval(() => { setClock(new Date()) }, TICK_MS)
    return () => { window.clearInterval(id) }
  }, [preference.on])

  // Whether this device has seen the nudge on, or null until the account has
  // answered at all.
  const seenOn = useRef<boolean | null>(null)

  // Turning it on starts the quiet from then (NUDGE-7) — wherever it was turned
  // on, this device or another. Reading it as already on is no such moment: a
  // stretch under way here is not started over by opening the app (NUDGE-6).
  // Declared before the tick below, so the tick reads the fresh moment.
  useEffect(() => {
    if (isLoading) return
    const before = seenOn.current
    seenOn.current = preference.on
    if (before === null || before === preference.on) return
    remember(preference.on ? { nudgedAt: new Date().toISOString(), standing: null } : NUDGE_UNSPOKEN)
  }, [isLoading, preference.on, remember])

  // A tick with nothing finished for the chosen span says so, once, and starts
  // the quiet again from itself (`nudgedAt`).
  useEffect(() => {
    if (isLoading || !preference.on) return
    const inPlay = tasksRef.current
    if (inPlay === null) return
    const here = remembered.current

    const found = findNudge(
      inPlay,
      {
        finishedAt: lastFinishedAt(inPlay, clock),
        nudgedAt: here.nudgedAt === null ? null : new Date(here.nudgedAt),
        watchingSince: watchingSince.current,
        // The hours opening start the quiet again, so a night is not answered
        // for the moment the morning comes round (NUDGE-13).
        openedAt: nudgeWindowOpenedAt(preference.window, clock),
      },
      preference.quietHours,
      preference.window,
      clock,
    )
    if (found === null) return

    remember({
      nudgedAt: clock.toISOString(),
      standing: { taskId: found.taskId, quietHours: found.quietHours },
    })
    notifyBrowser('Nothing done for a while', `Next up: “${found.title}”`)
  }, [isLoading, preference, tasks, clock, remember, deviceState])

  const nudgedAt = deviceState.nudgedAt === null ? null : new Date(deviceState.nudgedAt)
  const notice = settleNudge(deviceState.standing, tasks ?? [], nudgedAt, clock)

  const turnOn = useCallback(
    (on: boolean) => {
      persist({ ...preference, on })
      if (on) void askToNotify().then(setPermission)
    },
    [persist, preference],
  )

  const changeQuietHours = useCallback(
    (quietHours: QuietHours) => { persist({ ...preference, quietHours }) },
    [persist, preference],
  )

  // Hours taken on are hours from now: the quiet is counted from the opening
  // (NUDGE-13), and the stretch already behind them was never theirs to answer.
  const changeWindow = useCallback(
    (window: NudgeWindow | null) => { persist({ ...preference, window }) },
    [persist, preference],
  )

  const dismiss = useCallback(
    () => { remember({ ...remembered.current, standing: null }) },
    [remember],
  )

  return { preference, isLoading, turnOn, changeQuietHours, changeWindow, permission, notice, dismiss }
}

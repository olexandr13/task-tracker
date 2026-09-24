import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { findNudge, lastFinishedAt, settleNudge, type Nudge, type QuietHours, type Task } from '../core'
import type { NudgeRepository, NudgeSetting } from '../storage/nudgeRepository'
import { askToNotify, notifyBrowser, notifyPermission, type NotifyPermission } from './browserNotification'

/** How often the quiet is measured again. A minute is finer than any span offered. */
const TICK_MS = 60 * 1000

export interface NudgeControl {
  readonly setting: NudgeSetting
  /** Turning it on asks the browser for permission, once. */
  readonly turnOn: (on: boolean) => void
  readonly changeQuietHours: (hours: QuietHours) => void
  /** Whether the browser will post notifications, so Settings can say when it will not. */
  readonly permission: NotifyPermission
  readonly notice: Nudge | null
  readonly dismiss: () => void
}

/**
 * The nudge on this device: while it is on, the tasks are measured against the
 * clock every minute, and a quiet stretch of the chosen span says so — an
 * on-screen notice, and a browser notification where one is allowed.
 *
 * `tasks` is the set in play (Today's) — null while it is still loading, when a
 * quiet app is a loading one rather than an idle owner.
 *
 * A nudge that has fired is kept with the setting rather than held on screen
 * alone (NUDGE-6, NUDGE-8): firing spends the quiet stretch, so a notice lost
 * to a refresh or a remount would be a nudge the owner paid for and never saw.
 * What it still has to say is derived from the tasks each render (`settleNudge`),
 * so finishing its task anywhere takes it away.
 */
export function useNudge(repository: NudgeRepository, tasks: readonly Task[] | null): NudgeControl {
  const [setting, setSetting] = useState<NudgeSetting>(() => repository.load())
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

  const persist = useCallback(
    (next: NudgeSetting) => {
      setSetting(next)
      repository.save(next)
    },
    [repository],
  )

  useEffect(() => {
    if (!setting.on) return
    const id = window.setInterval(() => { setClock(new Date()) }, TICK_MS)
    return () => { window.clearInterval(id) }
  }, [setting.on])

  const nudgedAt = setting.nudgedAt === null ? null : new Date(setting.nudgedAt)
  const loaded = tasks !== null
  const notice = settleNudge(setting.standing, tasks ?? [], nudgedAt, clock)

  // A tick with nothing finished for the chosen span says so, once, and starts
  // the quiet again from itself (`nudgedAt`).
  useEffect(() => {
    if (!setting.on || !loaded) return
    const inPlay = tasksRef.current
    if (inPlay === null) return

    const found = findNudge(
      inPlay,
      {
        finishedAt: lastFinishedAt(inPlay, clock),
        nudgedAt: setting.nudgedAt === null ? null : new Date(setting.nudgedAt),
        watchingSince: watchingSince.current,
      },
      setting.quietHours,
      clock,
    )
    if (found === null) return

    persist({
      ...setting,
      nudgedAt: clock.toISOString(),
      standing: { taskId: found.taskId, quietHours: found.quietHours },
    })
    notifyBrowser('Nothing done for a while', `Next up: “${found.title}”`)
  }, [setting, loaded, clock, persist])

  const turnOn = useCallback(
    (on: boolean) => {
      // Turning it on starts the quiet from now: the span asked for is a span
      // from here, not one already half gone before it was ever asked for.
      persist({
        ...setting,
        on,
        nudgedAt: on ? new Date().toISOString() : setting.nudgedAt,
        standing: null,
      })
      if (on) void askToNotify().then(setPermission)
    },
    [persist, setting],
  )

  const changeQuietHours = useCallback(
    (quietHours: QuietHours) => { persist({ ...setting, quietHours }) },
    [persist, setting],
  )

  const dismiss = useCallback(() => { persist({ ...setting, standing: null }) }, [persist, setting])

  return { setting, turnOn, changeQuietHours, permission, notice, dismiss }
}

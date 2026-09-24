import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { dueReminders, standingReminders, type Reminder, type Task } from '../core'
import { askToNotify, notifyBrowser, notifyPermission, type NotifyPermission } from './browserNotification'

/**
 * How often the clock is read for an hour that has come round. Half a minute,
 * so an hour named to the minute is answered inside it: nothing is ever missed
 * for reading the clock too slowly — the stretch just watched is carried
 * forward whole — only said late.
 */
const TICK_MS = 30 * 1000

export interface ReminderControl {
  /** The reminders still standing, earliest first; empty when there is nothing to say. */
  readonly notices: readonly Reminder[]
  /** Whether the browser will post notifications, so the app can say when it will not. */
  readonly permission: NotifyPermission
  /**
   * Asks the browser for permission to notify, once — what setting an hour on a
   * task is implicitly asking for.
   */
  readonly ask: () => void
  readonly dismiss: () => void
}

/**
 * The hours tasks are due at, watched against the clock: when one comes round on
 * a task still to do, the app says so — a notice at the foot of the screen, and
 * a browser notification where one is allowed.
 *
 * `tasks` is the whole live set — null while it is still loading. A stretch is
 * only ever spent once something could be read in it, so an hour that struck
 * while the tasks were still arriving is still said once they are here.
 *
 * Nothing is stored. The stretch watched runs from when this device started
 * watching, so an hour that went by while the app was closed is not announced
 * on opening — it has been overdue all along, which the list says on its own,
 * and a morning's worth of notifications at six in the evening would be noise.
 * What a standing notice still has to say is derived from the tasks each render
 * (`standingReminders`), so finishing its task anywhere takes it away.
 */
export function useReminders(tasks: readonly Task[] | null): ReminderControl {
  const [standing, setStanding] = useState<readonly Reminder[]>([])
  const [permission, setPermission] = useState<NotifyPermission>(() => notifyPermission())
  const [clock, setClock] = useState(() => new Date())

  // The end of the stretch already watched. Everything up to here has been
  // asked about; the next tick asks about what falls after it.
  const watchedTo = useRef(new Date())
  // The latest tasks, for the tick to read: the tick runs on the clock, not on
  // every render, and must not see the set as it was when it was set up.
  const tasksRef = useRef(tasks)
  useLayoutEffect(() => {
    tasksRef.current = tasks
  })

  useEffect(() => {
    const id = window.setInterval(() => { setClock(new Date()) }, TICK_MS)
    return () => { window.clearInterval(id) }
  }, [])

  useEffect(() => {
    const inPlay = tasksRef.current
    // Still loading: the stretch is left unspent rather than read against no
    // tasks at all, so an hour that struck while they arrived is not lost.
    if (inPlay === null) return

    const since = watchedTo.current
    if (clock.getTime() <= since.getTime()) return
    watchedTo.current = clock

    const found = dueReminders(inPlay, since, clock)
    if (found.length === 0) return

    setStanding((current) => [...current, ...found])
    notifyBrowser(
      found.length === 1 ? 'Due now' : `${String(found.length)} tasks due now`,
      found.map((reminder) => `“${reminder.title}”`).join(' · '),
    )
  }, [clock])

  const ask = useCallback(() => { void askToNotify().then(setPermission) }, [])
  const dismiss = useCallback(() => { setStanding([]) }, [])

  // What the standing notices still have to say, as the tasks are now: a task
  // finished, deleted or renamed anywhere is read as it is rather than as it was.
  const notices = standingReminders(standing, tasks ?? [], clock)

  return { notices, permission, ask, dismiss }
}

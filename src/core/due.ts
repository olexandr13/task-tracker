/**
 * When a task is due, and the lists that follow from it.
 *
 * There is one question underneath everything here — which day is this task due,
 * as of now? A one-off answers with its date. A repeating task answers with the
 * occurrence in play, so a daily task is due today every day and a weekly one
 * missed on Monday is still due Monday on Tuesday. Everything else — overdue, in
 * Today, Week or Month — is that day read against today and against whether the
 * task is done.
 *
 * Like the rest of ./repeat, nothing is stored or rolled over: the answer is
 * derived from `now`, so a page left open picks up the new day on its own.
 */

import { atLocalTime, offsetDay, startOfLocalDay, toLocalDay, type LocalDay } from './day'
import { periodRange, type Period } from './progress'
import { currentOccurrence, nextOccurrence, occurrenceFrom, type Repeat } from './repeat'
import { hasDueDay, isComplete, isDeleted, startedOn, type Task, type TaskId } from './task'

/**
 * The day the task is due as of `now`, or null when it has none.
 *
 * A repeating task's occurrence from before its rule started asked nothing of
 * it. What that leaves depends on where the start came from. A day **chosen**
 * for it (`startDay`) is a day the owner picked, so the task is due on the first
 * occurrence from it: a Monday task started on a Thursday is due the Monday
 * after. A rule with no day chosen starts where the task was written, and there
 * is simply no occurrence in play yet — a weekly Monday task written on a
 * Tuesday is next due on Monday, not overdue from the day before it was thought of.
 *
 * A skipped occurrence hands the task on to the next one the rule gives, and
 * that one on again while it was skipped too — unless the task was done after
 * all, which reads as done on the occurrence in play.
 */
export function dueDay(task: Task, now: Date = new Date()): LocalDay | null {
  if (task.repeat === null) {
    return task.dueDate
  }

  let occurrence = currentOccurrence(task.repeat, now)
  if (toLocalDay(occurrence) < startedOn(task)) {
    if (task.startDay === null) {
      return null
    }
    occurrence = startOfLocalDay(firstDueDay(task.repeat, task.startDay))
  }

  if (!isComplete(task, now)) {
    while (task.skippedDays.includes(toLocalDay(occurrence))) {
      occurrence = nextOccurrence(task.repeat, occurrence)
    }
  }
  return toLocalDay(occurrence)
}

/**
 * The first day from `start` the rule comes round on — `start` itself where the
 * rule falls on it. The day a rule started there is first due, before any of its
 * occurrences has been and gone.
 */
export function firstDueDay(repeat: Repeat, start: LocalDay): LocalDay {
  return toLocalDay(occurrenceFrom(repeat, startOfLocalDay(start)))
}

/**
 * Whether the task has an occurrence to pass over: it repeats, is still to do,
 * and is due on a day. A one-off has no next day to move on to, and a done
 * occurrence was not skipped.
 */
export function canSkipOccurrence(task: Task, now: Date = new Date()): boolean {
  return task.repeat !== null && !isDeleted(task) && !isComplete(task, now) && dueDay(task, now) !== null
}

/**
 * Passes over the occurrence the task is due on, so it is due on the rule's next
 * day instead — without being done, so nothing is recorded or earned for it.
 * Skipping again passes over that one too. Ticking the task off afterwards is
 * doing the occurrence in play after all (see `Task.skippedDays`).
 *
 * Returns a new task; the one passed in is never modified.
 */
export function skipOccurrence(task: Task, now: Date = new Date()): Task {
  const day = dueDay(task, now)
  if (!canSkipOccurrence(task, now) || day === null) {
    return task
  }

  return { ...task, skippedDays: [...task.skippedDays, day].sort() }
}

/**
 * The exact moment the task is due, or null where there is no such moment: a
 * task with no day, or one due on a day with no hour to it (`dueTime`), which is
 * due some time that day rather than at a time.
 *
 * A repeating task's moment is its hour on the occurrence in play, so it moves
 * with the occurrence the way the day does: a daily 9:00 task is due at nine
 * every morning, without anything being stored or rolled over.
 */
export function dueMoment(task: Task, now: Date = new Date()): Date | null {
  if (task.dueTime === null) return null

  const day = dueDay(task, now)
  return day === null ? null : atLocalTime(day, task.dueTime)
}

/** A task whose hour has just come round, and the moment it was due at. */
export interface Reminder {
  readonly taskId: TaskId
  /** The title as it stands, so a task renamed since is named as it is now. */
  readonly title: string
  readonly at: Date
}

/**
 * The tasks whose due moment fell in the stretch just watched — after `since`,
 * up to and including `now` — and which are still to do. These are the ones
 * worth saying something about: an hour that has come round on a task nobody has
 * finished.
 *
 * The stretch is half-open at its start so that a moment is only ever reminded
 * of once, however often the clock is read: the tick that catches 9:00 carries
 * its own moment forward as the next `since`.
 *
 * Nothing is stored against the task. Which tasks these are is derived from the
 * clock and the tasks as they stand, so a task finished, deleted, moved or
 * renamed on another device is read as it is now rather than as it was when its
 * hour was set. A task due at an hour that went by while nothing was watching is
 * not here — it is simply overdue, which the list says on its own.
 *
 * Ordered by the moment they were due, earliest first.
 */
export function dueReminders(tasks: readonly Task[], since: Date, now: Date = new Date()): Reminder[] {
  return tasks
    .flatMap((task) => {
      if (isDeleted(task) || isComplete(task, now)) return []

      const at = dueMoment(task, now)
      if (at === null || at.getTime() <= since.getTime() || at.getTime() > now.getTime()) return []

      return [{ taskId: task.id, title: task.title, at }]
    })
    .sort((one, other) => one.at.getTime() - other.at.getTime())
}

/**
 * The reminders that still have something to say, read from the tasks as they
 * stand, and named as they are named now. One drops out once its task is done,
 * deleted or gone — a reminder saying to do something already done is worse
 * than none — so finishing the task on another device takes the notice away
 * here too, and a task renamed meanwhile is named afresh.
 *
 * The moment each was due is kept as it was: that is when the hour struck, and
 * moving the task's day afterwards does not unsay it. Order is kept.
 */
export function standingReminders(
  standing: readonly Reminder[],
  tasks: readonly Task[],
  now: Date = new Date(),
): Reminder[] {
  return standing.flatMap((reminder) => {
    const task = tasks.find((candidate) => candidate.id === reminder.taskId)
    if (task === undefined || isDeleted(task) || isComplete(task, now)) return []

    return [{ ...reminder, title: task.title }]
  })
}

/**
 * Past the moment it was wanted, and still not done: a day already gone, or —
 * where the task is due at an hour (`dueTime`) — that hour already struck. A
 * task due today at nine is late at ten rather than at midnight, which is the
 * whole point of having named the hour; one due today at six this evening is
 * not late all morning for having a day in common with it.
 */
export function isOverdue(task: Task, now: Date = new Date()): boolean {
  const due = dueDay(task, now)
  if (due === null || isComplete(task, now)) return false

  const at = dueMoment(task, now)
  return at === null ? due < toLocalDay(now) : at.getTime() < now.getTime()
}

/** The overdue tasks and everything else, the two runs a list is drawn in. */
export interface OverdueSplit {
  readonly overdue: readonly Task[]
  readonly rest: readonly Task[]
}

/**
 * The tasks split into the overdue ones and the rest, so a list can draw the
 * overdue under a heading of their own. Each run keeps the order it was given,
 * so tasks sorted by `sortForDisplay` — which already floats the overdue to the
 * top — stay sorted inside their run.
 *
 * Nothing is rewritten when the day turns: which run a task is in follows from
 * `now`, so a page left open moves a task that has just fallen behind on its
 * next render.
 */
export function splitOverdue(tasks: readonly Task[], now: Date = new Date()): OverdueSplit {
  return {
    overdue: tasks.filter((task) => isOverdue(task, now)),
    rest: tasks.filter((task) => !isOverdue(task, now)),
  }
}

/**
 * Whether the task belongs in the list for a period — Today, Week or Month —
 * the periods the progress bars count, a week running Monday to Sunday.
 *
 * To do, it belongs when it is due by the period's last day, overdue included —
 * a day missed does not let a task drop out of sight, and whatever is in Today
 * is in Week and Month too. A task with **no day at all** — no date and no rule —
 * is in every one of them: nothing asks for it on a particular day, which leaves
 * every day as good as the next, and a task nobody is ever shown is a task
 * nobody ever does.
 *
 * Done, it stays when it was due inside the period, whenever it was finished,
 * and otherwise when it was finished inside the period, so ticking something
 * off does not make it vanish — that is what keeps an overdue task finished
 * today in today's list, and what puts a task with no day there, the day it was
 * finished being the only day it has. A task finished ahead of a later period
 * stays in that period.
 *
 * A repeating task is in on its occurrence in play, so a Friday task joins the
 * week on Friday: ahead of that the only occurrence there is to show is last
 * week's.
 */
export function isInPeriod(task: Task, period: Period, now: Date = new Date()): boolean {
  const due = dueDay(task, now)
  if (isDeleted(task)) {
    return false
  }

  const last = lastDayOf(period, now)
  if (!isComplete(task, now)) {
    // No day and no rule: due by any day the period ends on, this one included.
    // A repeating task whose rule has not come round yet has a day — just not
    // one in play — so it is left out, as an occurrence still to come is.
    if (!hasDueDay(task)) return true
    return due !== null && due <= last
  }

  const first = toLocalDay(periodRange(period, now).start)
  if (due !== null && due >= first) {
    return due <= last
  }

  const finished = task.completedAt === null ? null : toLocalDay(new Date(task.completedAt))
  return finished !== null && finished >= first && finished <= last
}

/**
 * The last day of the period `now` falls in — today, this Sunday, the end of
 * this month — and so the day a task added to that period's list starts on.
 */
export function lastDayOf(period: Period, now: Date = new Date()): LocalDay {
  return offsetDay(toLocalDay(periodRange(period, now).end), -1)
}

/**
 * The day "Next week" sets: the Sunday that closes next week. Weeks run Monday
 * to Sunday, as ./progress counts them, so from any day of this week — Sunday
 * included — it is the Sunday after the coming Monday.
 */
export function nextWeekDueDay(now: Date = new Date()): LocalDay {
  return offsetDay(lastDayOf('week', now), 7)
}

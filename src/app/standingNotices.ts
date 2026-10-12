import type { HourSlot, Nudge, PendingCheckIn, QuietHours, Reminder, Task, TaskId } from '../core'
import type { GoalNotice } from './useTaskTimer'

/**
 * One thing the app has said that is still standing: shown at the foot or the
 * top of the screen, and not yet answered or dismissed. The Notifications page
 * lists them (NOTIF-3), and its entry counts them (NOTIF-6).
 */
export type StandingNotice =
  | { readonly kind: 'drop' }
  | { readonly kind: 'haul' }
  | { readonly kind: 'goal'; readonly taskId: TaskId; readonly title: string }
  | { readonly kind: 'reminder'; readonly taskId: TaskId; readonly title: string; readonly at: Date }
  | { readonly kind: 'check-in'; readonly slot: HourSlot; readonly others: number }
  | { readonly kind: 'nudge'; readonly taskId: TaskId; readonly title: string; readonly quietHours: QuietHours }

/** What each part of the app has standing, as its hook reports it. */
export interface NoticeSources {
  /** The live tasks, so a notice whose task has gone says nothing. */
  readonly tasks: readonly Task[]
  /** Whether the Drop has arrived and is unopened (CHST-29). */
  readonly drop: boolean
  /** Whether the Haul is here and unopened (CHST-30). */
  readonly haul: boolean
  readonly goal: GoalNotice | null
  /** Earliest first, as `useReminders` keeps them. */
  readonly reminders: readonly Reminder[]
  readonly checkIn: PendingCheckIn | null
  readonly nudge: Nudge | null
  /** Which of their parts are there at all: a notice of a part switched off is not standing. */
  readonly on: { readonly cases: boolean; readonly checkIn: boolean; readonly nudge: boolean }
}

/**
 * Every notice standing, in the order the screen shows them, top to bottom:
 * the cases at the top of the window, then the stack at its foot — the time
 * goal, the reminders, the check-in, the nudge.
 *
 * Only what is said to the owner unasked is here (NOTIF-3). The warm-up holding
 * a habit back, the undo, the sync notice and a refused save are each the
 * answer to something just done, and stay at the foot of the screen alone.
 *
 * A notice pointing at a task that is no longer there has nothing to open, and
 * is left out, as its toast leaves it out.
 */
export function standingNotices(sources: NoticeSources): StandingNotice[] {
  const { tasks, on } = sources
  const exists = (taskId: TaskId) => tasks.some((task) => task.id === taskId)
  const notices: StandingNotice[] = []

  if (on.cases && sources.drop) notices.push({ kind: 'drop' })
  if (on.cases && sources.haul) notices.push({ kind: 'haul' })

  const goal = sources.goal
  if (goal !== null && exists(goal.taskId)) {
    notices.push({ kind: 'goal', taskId: goal.taskId, title: goal.title })
  }

  for (const reminder of sources.reminders) {
    if (exists(reminder.taskId)) {
      notices.push({ kind: 'reminder', taskId: reminder.taskId, title: reminder.title, at: reminder.at })
    }
  }

  const checkIn = sources.checkIn
  if (on.checkIn && checkIn !== null) {
    notices.push({ kind: 'check-in', slot: checkIn.slot, others: checkIn.others })
  }

  const nudge = sources.nudge
  if (on.nudge && nudge !== null && exists(nudge.taskId)) {
    notices.push({ kind: 'nudge', taskId: nudge.taskId, title: nudge.title, quietHours: nudge.quietHours })
  }

  return notices
}

/** A name for one notice that stays the same while it stands, for React to keep its row by. */
export function noticeKey(notice: StandingNotice): string {
  switch (notice.kind) {
    case 'reminder':
      return `reminder/${notice.taskId}`
    case 'goal':
      return `goal/${notice.taskId}`
    default:
      return notice.kind
  }
}

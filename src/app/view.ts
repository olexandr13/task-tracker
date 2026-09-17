import { isInPeriod, lastDayOf, type LocalDay, type Task } from '../core'

/**
 * The screens the app has, and where another would be added.
 *
 * Four of them are lists of tasks — the ones for today, this week and this
 * month, and every task — and share everything but which tasks they show and
 * the day a task added to them starts with. Habits, the trash and settings are
 * screens of their own.
 */
export type View = 'today' | 'week' | 'month' | 'tasks' | 'habits' | 'trash' | 'settings'

export type ListView = Exclude<View, 'habits' | 'trash' | 'settings'>

/** The lists named after a period, which a phone keeps behind a single tab. */
export type PeriodView = Exclude<ListView, 'tasks'>

export const PERIOD_VIEWS: readonly PeriodView[] = ['today', 'week', 'month']

export function isListView(view: View): view is ListView {
  return view === 'tasks' || isPeriodView(view)
}

export function isPeriodView(view: View): view is PeriodView {
  return view === 'today' || view === 'week' || view === 'month'
}

/**
 * Whether a live task is one the list shows. Today, Week and Month are named
 * after the periods the progress bars count, and each shows its own.
 */
export function isInList(view: ListView, task: Task, now: Date): boolean {
  return view === 'tasks' || isInPeriod(task, view, now)
}

/** The day a task added to the list starts on: the last day of its period, if it has one. */
export function listDueDay(view: ListView, now: Date): LocalDay | null {
  return view === 'tasks' ? null : lastDayOf(view, now)
}

export const VIEW_LABELS: Record<View, string> = {
  today: 'Today',
  week: 'Week',
  month: 'Month',
  tasks: 'Tasks',
  habits: 'Habits',
  trash: 'Trash',
  settings: 'Settings',
}

/** The view the app opens on when the address names none. */
export const DEFAULT_VIEW: View = 'today'

function isView(name: string): name is View {
  return Object.hasOwn(VIEW_LABELS, name)
}

/**
 * Where a view lives in the address — `#/week` — so a reload, a bookmark or the
 * back button lands on it. After the `#`, so any host serves it as the one page
 * the app is.
 */
export function viewHash(view: View): string {
  return `#/${view}`
}

/** The view an address's hash names, or null when it names none. */
export function viewFromHash(hash: string): View | null {
  const name = hash.replace(/^#\/?/, '')
  return isView(name) ? name : null
}

/** What each list says when it has nothing in it, pointing at the box above. */
export const EMPTY_MESSAGES: Record<ListView, string> = {
  today: 'A fresh day. Add a task above to get going.',
  week: 'Nothing due this week yet. Add a task above to plan it.',
  month: 'Nothing due this month yet. Add a task above to plan it.',
  tasks: 'Start small: add your first task above.',
}

/** What each list says once everything in it is done. */
export const ALL_DONE_MESSAGES: Record<ListView, string> = {
  today: 'Everything for today is done. Great work!',
  week: 'Everything for this week is done. Great work!',
  month: 'Everything for this month is done. Great work!',
  tasks: 'Every task is done. Great work!',
}

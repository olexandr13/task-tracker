import { hasTag, isInPeriod, isTagName, lastDayOf, type LocalDay, type Task } from '../core'

/**
 * The screens the app has, and where another would be added.
 *
 * Most of them are lists of tasks — the ones for today, this week and this
 * month, every task, and the tasks carrying a tag — and share everything but
 * which tasks they show and what a task added to them starts with. Habits,
 * rewards, the tags, the trash and settings are screens of their own.
 */
export type FixedView = 'today' | 'week' | 'month' | 'tasks' | 'habits' | 'rewards' | 'tags' | 'trash' | 'settings'

/**
 * The list of one tag's tasks. There is one for every tag there could be, so it
 * is named by the tag rather than listed; a tag name holds no slash, so the name
 * is never mistaken for anything else.
 */
export type TagView = `tag/${string}`

export type View = FixedView | TagView

export type ListView = Exclude<View, 'habits' | 'rewards' | 'tags' | 'trash' | 'settings'>

/** The lists named after a period, which a phone keeps behind a single tab. */
export type PeriodView = 'today' | 'week' | 'month'

export const PERIOD_VIEWS: readonly PeriodView[] = ['today', 'week', 'month']

export function isListView(view: View): view is ListView {
  return view === 'tasks' || isPeriodView(view) || isTagView(view)
}

export function isPeriodView(view: View): view is PeriodView {
  return view === 'today' || view === 'week' || view === 'month'
}

export function isTagView(view: View): view is TagView {
  return view.startsWith('tag/')
}

export function tagView(tag: string): TagView {
  return `tag/${tag}`
}

/**
 * Whether being on `view` is being somewhere under `menu` in the navigation: on
 * it, or on a tag's list under Tags.
 */
export function isUnder(view: View, menu: View): boolean {
  return view === menu || (menu === 'tags' && isTagView(view))
}

/** The tag a tag's list is of. */
export function viewTag(view: TagView): string {
  return view.slice('tag/'.length)
}

/**
 * Whether a live task is one the list shows. Today, Week and Month are named
 * after the periods the progress bars count, and each shows its own; a tag's
 * list shows the tasks carrying it, whatever case it is named in.
 */
export function isInList(view: ListView, task: Task, now: Date): boolean {
  if (view === 'tasks') return true
  if (isTagView(view)) return hasTag(task, viewTag(view))
  return isInPeriod(task, view, now)
}

/** The day a task added to the list starts on: the last day of its period, if it has one. */
export function listDueDay(view: ListView, now: Date): LocalDay | null {
  return isPeriodView(view) ? lastDayOf(view, now) : null
}

/** The tags a task added to the list starts with: a tag's list gives it its tag. */
export function listTags(view: ListView): readonly string[] {
  return isTagView(view) ? [viewTag(view)] : []
}

export const VIEW_LABELS: Record<FixedView, string> = {
  today: 'Today',
  week: 'Week',
  month: 'Month',
  tasks: 'Tasks',
  habits: 'Habits',
  rewards: 'Rewards',
  tags: 'Tags',
  trash: 'Trash',
  settings: 'Settings',
}

/** What a view is called: its name, or for a tag's list the tag. */
export function viewLabel(view: View): string {
  return isTagView(view) ? viewTag(view) : VIEW_LABELS[view]
}

/** The view the app opens on when the address names none. */
export const DEFAULT_VIEW: View = 'today'

function isFixedView(name: string): name is FixedView {
  return Object.hasOwn(VIEW_LABELS, name)
}

/**
 * Where a view lives in the address — `#/week`, `#/tag/work` — so a reload, a
 * bookmark or the back button lands on it. After the `#`, so any host serves it
 * as the one page the app is. A tag is escaped, being whatever was typed.
 */
export function viewHash(view: View): string {
  return isTagView(view) ? `#/tag/${encodeURIComponent(viewTag(view))}` : `#/${view}`
}

/** The view an address's hash names, or null when it names none. */
export function viewFromHash(hash: string): View | null {
  const name = hash.replace(/^#\/?/, '')
  if (isFixedView(name)) return name
  if (!name.startsWith('tag/')) return null

  const tag = decoded(name.slice('tag/'.length))
  return tag !== null && isTagName(tag) ? tagView(tag) : null
}

/** An escaped part of an address, or null when it was escaped wrongly. */
function decoded(part: string): string | null {
  try {
    return decodeURIComponent(part)
  } catch {
    return null
  }
}

/** What each list says when it has nothing in it, pointing at the box above. */
export function emptyMessage(view: ListView): string {
  switch (view) {
    case 'today':
      return 'A fresh day. Add a task above to get going.'
    case 'week':
      return 'Nothing due this week yet. Add a task above to plan it.'
    case 'month':
      return 'Nothing due this month yet. Add a task above to plan it.'
    case 'tasks':
      return 'Start small: add your first task above.'
    default:
      return `Nothing tagged ${viewTag(view)} yet. Add a task above to tag it.`
  }
}

/** What each list says once everything in it is done. */
export function allDoneMessage(view: ListView): string {
  switch (view) {
    case 'today':
      return 'Everything for today is done. Great work!'
    case 'week':
      return 'Everything for this week is done. Great work!'
    case 'month':
      return 'Everything for this month is done. Great work!'
    case 'tasks':
      return 'Every task is done. Great work!'
    default:
      return `Everything tagged ${viewTag(view)} is done. Great work!`
  }
}

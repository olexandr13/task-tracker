import {
  hasTag,
  isInList,
  isInPeriod,
  isInInbox,
  isTagName,
  lastDayOf,
  type List,
  type ListId,
  type LocalDay,
  type Task,
} from '../core'

/**
 * The screens the app has, and where another would be added.
 *
 * Most of them show tasks — the ones for today, this week and this month, every
 * task, the Inbox, one list's and the ones carrying a tag — and share everything
 * but which tasks they show and what a task added to them starts with. Habits,
 * rewards, the lists, the tags, the trash and settings are screens of their own.
 *
 * "View" is this file's word for a screen. What the owner calls a **list** is
 * somewhere tasks are filed (`../core/list`), which is a different thing: Today
 * and Week are views, Work and Home are lists.
 */
export type FixedView =
  | 'today'
  | 'week'
  | 'month'
  | 'tasks'
  | 'inbox'
  | 'habits'
  | 'rewards'
  | 'lists'
  | 'tags'
  | 'trash'
  | 'settings'

/**
 * One list's tasks. There is one for every list there could be, so it is named
 * by the list rather than listed. Named by the list's **id**, not its name, so
 * renaming a list does not change its address, and no name has to be kept free
 * of slashes.
 */
export type OneListView = `list/${ListId}`

/**
 * The tasks carrying one tag. There is one for every tag there could be, so it
 * is named by the tag rather than listed; a tag name holds no slash, so the name
 * is never mistaken for anything else.
 */
export type TagView = `tag/${string}`

export type View = FixedView | OneListView | TagView

/** The views that show tasks: the box to add one, the rows, and the rail beside them. */
export type TaskView = Exclude<View, 'habits' | 'rewards' | 'lists' | 'tags' | 'trash' | 'settings'>

/** The views named after a period, which a phone keeps behind a single tab. */
export type PeriodView = 'today' | 'week' | 'month'

export const PERIOD_VIEWS: readonly PeriodView[] = ['today', 'week', 'month']

export function isTaskView(view: View): view is TaskView {
  return view === 'tasks' || view === 'inbox' || isPeriodView(view) || isOneListView(view) || isTagView(view)
}

export function isPeriodView(view: View): view is PeriodView {
  return view === 'today' || view === 'week' || view === 'month'
}

export function isOneListView(view: View): view is OneListView {
  return view.startsWith('list/')
}

export function isTagView(view: View): view is TagView {
  return view.startsWith('tag/')
}

export function oneListView(id: ListId): OneListView {
  return `list/${id}`
}

export function tagView(tag: string): TagView {
  return `tag/${tag}`
}

/**
 * Whether being on `view` is being somewhere under `menu` in the navigation: on
 * it, or on one of the screens opened from it — a list or the Inbox under Lists,
 * a tag's tasks under Tags.
 */
export function isUnder(view: View, menu: View): boolean {
  if (view === menu) return true
  if (menu === 'lists') return isOneListView(view) || view === 'inbox'
  return menu === 'tags' && isTagView(view)
}

/** The list one list's view is of. */
export function viewListId(view: OneListView): ListId {
  return view.slice('list/'.length)
}

/** The tag a tag's view is of. */
export function viewTag(view: TagView): string {
  return view.slice('tag/'.length)
}

/**
 * Whether a live task is one the view shows. Today, Week and Month are named
 * after the periods the progress bars count, and each shows its own; a list's
 * view shows what is filed under it, the Inbox what is filed nowhere, and a
 * tag's the tasks carrying it, whatever case it is named in.
 *
 * `lists` is every list there is, which the Inbox needs: a task naming a list
 * that has gone is in the Inbox, so nothing is out of reach of every view at once.
 */
export function showsTask(view: TaskView, task: Task, now: Date, lists: readonly List[]): boolean {
  if (view === 'tasks') return true
  if (view === 'inbox') return isInInbox(task, lists)
  if (isOneListView(view)) return isInList(task, viewListId(view))
  if (isTagView(view)) return hasTag(task, viewTag(view))
  return isInPeriod(task, view, now)
}

/** The day a task added to the view starts on: the last day of its period, if it has one. */
export function newTaskDueDay(view: TaskView, now: Date): LocalDay | null {
  return isPeriodView(view) ? lastDayOf(view, now) : null
}

/** The tags a task added to the view starts with: a tag's view gives it its tag. */
export function newTaskTags(view: TaskView): readonly string[] {
  return isTagView(view) ? [viewTag(view)] : []
}

/**
 * The list a task added to the view is filed under: a list's view files it
 * there. Everywhere else — the Inbox included — it starts in no list.
 */
export function newTaskListId(view: TaskView): ListId | null {
  return isOneListView(view) ? viewListId(view) : null
}

export const VIEW_LABELS: Record<FixedView, string> = {
  today: 'Today',
  week: 'Week',
  month: 'Month',
  tasks: 'Tasks',
  inbox: 'Inbox',
  habits: 'Habits',
  rewards: 'Rewards',
  lists: 'Lists',
  tags: 'Tags',
  trash: 'Trash',
  settings: 'Settings',
}

/**
 * What a view is called: its name, for a tag's view the tag, and for a list's
 * the list's name — which only the lists themselves can say, so a view of a
 * list not among them is named as the Inbox it shows as.
 */
export function viewLabel(view: View, lists: readonly List[] = []): string {
  if (isTagView(view)) return viewTag(view)
  if (isOneListView(view)) {
    const id = viewListId(view)
    return lists.find((list) => list.id === id)?.name ?? VIEW_LABELS.inbox
  }
  return VIEW_LABELS[view]
}

/** The view the app opens on when the address names none. */
export const DEFAULT_VIEW: View = 'today'

function isFixedView(name: string): name is FixedView {
  return Object.hasOwn(VIEW_LABELS, name)
}

/**
 * Where a view lives in the address — `#/week`, `#/list/8f3…`, `#/tag/work` — so
 * a reload, a bookmark or the back button lands on it. After the `#`, so any
 * host serves it as the one page the app is. A tag is escaped, being whatever
 * was typed; a list's id needs no escaping, being a UUID.
 */
export function viewHash(view: View): string {
  return isTagView(view) ? `#/tag/${encodeURIComponent(viewTag(view))}` : `#/${view}`
}

/** The view an address's hash names, or null when it names none. */
export function viewFromHash(hash: string): View | null {
  const name = hash.replace(/^#\/?/, '')
  if (isFixedView(name)) return name

  if (name.startsWith('list/')) {
    const id = decoded(name.slice('list/'.length))
    return id !== null && id !== '' ? oneListView(id) : null
  }

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

/** What each view says when it has nothing in it, pointing at the box above. */
export function emptyMessage(view: TaskView, lists: readonly List[] = []): string {
  switch (view) {
    case 'today':
      return 'A fresh day. Add a task above to get going.'
    case 'week':
      return 'Nothing due this week yet. Add a task above to plan it.'
    case 'month':
      return 'Nothing due this month yet. Add a task above to plan it.'
    case 'tasks':
      return 'Start small: add your first task above.'
    case 'inbox':
      return 'Nothing unfiled. Add a task above, or find one in a list.'
    default:
      return isOneListView(view)
        ? `Nothing in ${viewLabel(view, lists)} yet. Add a task above to put it there.`
        : `Nothing tagged ${viewTag(view)} yet. Add a task above to tag it.`
  }
}

/** What each view says once everything in it is done. */
export function allDoneMessage(view: TaskView, lists: readonly List[] = []): string {
  switch (view) {
    case 'today':
      return 'Everything for today is done. Great work!'
    case 'week':
      return 'Everything for this week is done. Great work!'
    case 'month':
      return 'Everything for this month is done. Great work!'
    case 'tasks':
      return 'Every task is done. Great work!'
    case 'inbox':
      return 'The Inbox is clear. Great work!'
    default:
      return isOneListView(view)
        ? `Everything in ${viewLabel(view, lists)} is done. Great work!`
        : `Everything tagged ${viewTag(view)} is done. Great work!`
  }
}

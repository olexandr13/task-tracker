import {
  hasTag,
  isHabit,
  isInList,
  isInPeriod,
  isInInbox,
  isTagName,
  lastDayOf,
  ROLLING_SPANS,
  sameTag,
  type CompletionSpan,
  type CompletionSpans,
  type List,
  type ListId,
  type LocalDay,
  type Task,
} from '../core'
import type { TaskScope } from '../storage/taskRepository'

/**
 * The screens the app has, and where another would be added.
 *
 * Most of them show tasks — the ones for today, this week and this month, every
 * task, the Inbox, one list's and the ones carrying a tag — and share everything
 * but which tasks they show, what a task added to them starts with, whether
 * their done tasks are divided by when they were finished and which of those
 * spans are folded away. Habits, the rewards pages, More, the modes, the lists,
 * the tags, the balance of time, the activity log, the trash and settings are
 * screens of their own.
 *
 * Rewards is six screens rather than one: how the points stand, and under it the
 * cases, the history, the prizes, the wishlist and the rules (RWD-19, RWD-30).
 * They are named `rewards/…`, which
 * is what their addresses read as and what marks them as belonging under Rewards.
 * Modes is five in the same way (MODE-1): the list of them, and a page for each
 * mode explaining what it does, named `modes/…`.
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
  | 'rewards/cases'
  | 'rewards/history'
  | 'rewards/prizes'
  | 'rewards/wishlist'
  | 'rewards/rules'
  | 'lists'
  | 'tags'
  | 'balance'
  | 'activity'
  | 'more'
  | 'modes'
  | 'modes/procrastination'
  | 'modes/warm-up'
  | 'modes/nudge'
  | 'modes/check-in'
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
export type TaskView = Exclude<
  View,
  'habits' | RewardsView | 'lists' | 'tags' | 'balance' | 'activity' | 'more' | ModesView | 'trash' | 'settings'
>

/**
 * The pages under Rewards, in the order they are listed: Cases a cleared day
 * earns a key to, what was earned and spent, the prizes points buy again and
 * again, the wishlist they are saved up for, and what earns them (RWD-30).
 * Rewards itself is how the points stand, and heads them.
 *
 * Cases comes first of them, ahead of the history: a key nobody notices
 * earns nothing, and the one page here with something waiting on it should be
 * the one the eye reaches first (CHST-22).
 */
export const UNDER_REWARDS = [
  'rewards/cases',
  'rewards/history',
  'rewards/prizes',
  'rewards/wishlist',
  'rewards/rules',
] as const satisfies readonly FixedView[]

/** Rewards and the pages under it: the one section of the app that is more than a page. */
export type RewardsView = 'rewards' | (typeof UNDER_REWARDS)[number]

export function isRewardsView(view: View): view is RewardsView {
  return view === 'rewards' || (UNDER_REWARDS as readonly View[]).includes(view)
}

/**
 * The modes and what they do, in the order the Modes page lists them: the one
 * that picks a single task out of Today, the one that allows one more habit
 * with each of its thirty days, the one that speaks up when nothing is getting
 * done, and the one that asks every hour what was done (MODE-2). Each is a page of its own, so a mode can say what it
 * does rather than being a switch whose name has to carry the whole idea.
 */
export const UNDER_MODES = [
  'modes/procrastination',
  'modes/warm-up',
  'modes/nudge',
  'modes/check-in',
] as const satisfies readonly FixedView[]

/** One mode, as the view of its own page. */
export type ModeView = (typeof UNDER_MODES)[number]

/** Modes and the pages under it: the list of the modes, and each mode's own page. */
export type ModesView = 'modes' | ModeView

export function isModesView(view: View): view is ModesView {
  return view === 'modes' || (UNDER_MODES as readonly View[]).includes(view)
}

/**
 * The pages More's own page lists, in the order it lists them: Lists, which a
 * phone's bar has no tab for (UI-34), Tags, now that Rewards has a place of its
 * own everywhere (RWD-19), Balance, where the time logged divides between work
 * and rest (BAL-1), the activity log, where each hour of the day is written
 * down (ACT-1), and Modes, which holds the switches that were once rows on More
 * itself (MODE-1).
 */
export const ON_MORE = ['lists', 'tags', 'balance', 'activity', 'modes'] as const satisfies readonly FixedView[]

/**
 * The pages More stands for while one of them is open — the ones on its page
 * (`ON_MORE`) that are reached from nowhere else. Lists is listed on More but
 * left out here: Tasks is the tab marked while it is open (UI-34) and the
 * sidebar has an entry for it, so More standing for it too would mark two at
 * once. Adding a page to More's page is deciding both: whether it is listed
 * there, and whether it is reached only from there.
 */
export const UNDER_MORE = ['tags', 'balance', 'activity', 'modes'] as const satisfies readonly FixedView[]

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
 * a tag's tasks under Tags, the history, the wishlist and the rules under
 * Rewards, or Tags, Balance, the activity log, Modes and each mode's page under More.
 */
export function isUnder(view: View, menu: View): boolean {
  if (view === menu) return true
  if (menu === 'lists') return isOneListView(view) || view === 'inbox'
  if (menu === 'tags') return isTagView(view)
  if (menu === 'rewards') return isRewardsView(view)
  if (menu === 'modes') return isModesView(view)
  if (menu === 'more') {
    return (UNDER_MORE as readonly View[]).includes(view) || isTagView(view) || isModesView(view)
  }
  return false
}

/**
 * The view one level above `view`, or null at the top (UI-37). The views make a
 * tree whose top is the bar's tabs — the periods, Tasks, Habits, Rewards, More
 * and Settings. Under Tasks are Lists and the Trash, its two buttons (UI-34);
 * under Lists the Inbox and each list; under Rewards its five pages (RWD-19);
 * under More Tags, Balance, the activity log and Modes (UI-45), under Tags each tag's tasks, and under
 * Modes each mode's page (MODE-7). This is what the back button climbs, so a
 * page is left the way it was reached rather than the way it happened to be
 * arrived at.
 */
export function parentView(view: View): View | null {
  if (isOneListView(view) || view === 'inbox') return 'lists'
  if (isTagView(view)) return 'tags'
  if (view === 'lists' || view === 'trash') return 'tasks'
  if (view === 'tags' || view === 'balance' || view === 'activity' || view === 'modes') return 'more'
  if ((UNDER_REWARDS as readonly View[]).includes(view)) return 'rewards'
  if ((UNDER_MODES as readonly View[]).includes(view)) return 'modes'
  return null
}

/** The view at the top of `view`'s branch: itself when nothing is above it. */
export function rootView(view: View): View {
  let root = view
  for (let above = parentView(root); above !== null; above = parentView(root)) root = above
  return root
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

/**
 * Where to go to see a live task: the view already open when it shows the
 * task — Habits does for a habit — or else Today when Today shows it, or else
 * Tasks, which shows every task there is.
 */
export function viewShowingTask(task: Task, current: View, now: Date, lists: readonly List[]): View {
  const shownHere = isTaskView(current) ? showsTask(current, task, now, lists) : current === 'habits' && isHabit(task)
  if (shownHere) return current
  return showsTask('today', task, now, lists) ? 'today' : 'tasks'
}

/**
 * A list's spans — the Inbox's, one list's or one tag's: today's work apart,
 * then the week and the month back from it. Yesterday is part of the week here
 * rather than a span of its own.
 */
const LIST_SPANS: CompletionSpans = ['today', 'last7Days', 'last30Days']

/** Everything a list has done before today. */
const LIST_FOLDED: readonly CompletionSpan[] = ['last7Days', 'last30Days', 'earlier']

/** Everything done before today, on Tasks. */
const TASKS_FOLDED: readonly CompletionSpan[] = ['yesterday', 'last7Days', 'last30Days', 'earlier']

const NONE_FOLDED: readonly CompletionSpan[] = []

/** The views that are a list of tasks kept together, rather than a period's: the Inbox, a list's and a tag's. */
function isListLike(view: TaskView): boolean {
  return view === 'inbox' || isOneListView(view) || isTagView(view)
}

/**
 * How the view divides its done tasks by when they were finished, or null for
 * one run of them. Tasks holds every done task there is, however long ago, and
 * one run of them would bury today's work under last month's, so it counts back
 * in rolling windows. The Inbox, a list and a tag keep today's work apart from
 * the week's and the month's. Today, Week and Month keep one run, being one
 * period's work already.
 */
export function doneSpans(view: TaskView): CompletionSpans | null {
  if (view === 'tasks') return ROLLING_SPANS
  if (isListLike(view)) return LIST_SPANS
  return null
}

/**
 * The spans of done work the view draws folded away behind their headings until
 * one is opened: everywhere it divides them, all of it bar today's (TASK-72,
 * TASK-73), so a list shows what was done today and says what was done before —
 * and what was done long before is not loaded until it is asked for (TASK-74).
 */
export function foldedSpans(view: TaskView): readonly CompletionSpan[] {
  if (view === 'tasks') return TASKS_FOLDED
  if (isListLike(view)) return LIST_FOLDED
  return NONE_FOLDED
}

/**
 * The tasks a view's done spans are drawn from, as the server counts them, to
 * ask whether any of them is history not loaded yet (STORE-55): every task on
 * Tasks, the ones in no list for the Inbox, a list's own, a tag's — spelled as
 * the tag is kept, `known` being every tag there is. Null for a view with no
 * spans to fold.
 */
export function historyScope(view: TaskView, known: readonly string[] = []): TaskScope | null {
  if (view === 'tasks') return { kind: 'all' }
  if (view === 'inbox') return { kind: 'list', listId: null }
  if (isOneListView(view)) return { kind: 'list', listId: viewListId(view) }
  if (isTagView(view)) {
    const tag = viewTag(view)
    return { kind: 'tag', tag: known.find((name) => sameTag(name, tag)) ?? tag }
  }
  return null
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
  'rewards/cases': 'Cases',
  'rewards/history': 'History',
  'rewards/prizes': 'Prizes',
  'rewards/wishlist': 'Wishlist',
  'rewards/rules': 'Rules',
  lists: 'Lists',
  tags: 'Tags',
  balance: 'Balance',
  activity: 'Activity log',
  more: 'More',
  modes: 'Modes',
  'modes/procrastination': 'Procrastination',
  'modes/warm-up': 'Warm-up',
  'modes/nudge': 'Nudge',
  'modes/check-in': 'Check-in',
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
  // Cases was addressed as the chest. A bookmark from then still opens it.
  if (name === 'rewards/chest') return 'rewards/cases'
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

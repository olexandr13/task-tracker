/**
 * The screens the app has, and where another would be added.
 *
 * Two of them are lists of tasks — every task, and the ones for today — and
 * share everything but which tasks they show and the day a task added to them
 * starts with. Habits and the trash are screens of their own.
 */
export type View = 'today' | 'tasks' | 'habits' | 'trash'

export type ListView = Exclude<View, 'habits' | 'trash'>

export function isListView(view: View): view is ListView {
  return view === 'today' || view === 'tasks'
}

export const VIEW_LABELS: Record<View, string> = {
  today: 'Today',
  tasks: 'Tasks',
  habits: 'Habits',
  trash: 'Trash',
}

/** What each list says when it has nothing in it, pointing at the box above. */
export const EMPTY_MESSAGES: Record<ListView, string> = {
  today: 'A fresh day. Add a task above to get going.',
  tasks: 'Start small: add your first task above.',
}

/** What each list says once everything in it is done. */
export const ALL_DONE_MESSAGES: Record<ListView, string> = {
  today: 'Everything for today is done. Great work!',
  tasks: 'Every task is done. Great work!',
}

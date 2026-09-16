/**
 * The screens the app has, and where another would be added.
 *
 * Two of them are lists of tasks — every task, and the ones for today — and
 * share everything but which tasks they show and the day a task added to them
 * starts with. The trash is a screen of its own.
 */
export type View = 'today' | 'tasks' | 'trash'

export type ListView = Exclude<View, 'trash'>

export const VIEW_LABELS: Record<View, string> = {
  today: 'Today',
  tasks: 'Tasks',
  trash: 'Trash',
}

/** What each list says when it has nothing in it, pointing at the box above. */
export const EMPTY_MESSAGES: Record<ListView, string> = {
  today: 'Nothing due today. Add a task above and it will be due today.',
  tasks: 'Nothing here yet. Add your first task above.',
}

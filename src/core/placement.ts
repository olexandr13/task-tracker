/**
 * Which side of a target a moved thing lands on.
 *
 * Its own module because two different lists answer to it: the tasks in a list,
 * which carry a number apiece so two devices can merge them (./order), and the
 * items on a checklist, which are an array inside one task (./subtask). Keeping
 * the word in one place is what lets a drag and drop speak the same way
 * wherever it is dropped.
 */
export type Placement = 'before' | 'after'

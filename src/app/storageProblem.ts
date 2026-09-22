/**
 * Something the database — or, as guest, the browser — refused: reading the
 * account's data in, or keeping a change. Being offline is not one: changes are
 * kept on the device and sent later (STORE-18), and the sync notice says so.
 */
export type StorageProblem = 'load' | 'save'

/** Called by whatever holds the account's data when the service behind it refuses. */
export type ReportProblem = (problem: StorageProblem) => void

/** For a caller with nowhere to say it: the console has it already. */
export const ignoreProblems: ReportProblem = () => {}

export const STORAGE_PROBLEM_LABELS: Record<StorageProblem, string> = {
  load: 'Couldn’t load everything from your account. Reload to try again.',
  save: 'Couldn’t save a change. Reload to see what was kept.',
}

/** What a list says in place of being empty when its tasks could not be loaded. */
export const TASKS_NOT_LOADED = 'Couldn’t load your tasks. Reload to try again.'

/**
 * The one worth saying of two. A failed load outranks a failed save: the screen
 * is not showing what the account holds, and saving over it is what to avoid.
 */
export function worseProblem(a: StorageProblem | null, b: StorageProblem): StorageProblem {
  return a === 'load' || b === 'load' ? 'load' : 'save'
}

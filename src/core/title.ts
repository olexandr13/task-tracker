/**
 * The one rule about titles, shared by everything that has one.
 *
 * A task and a subtask are different records, but "trimmed, and never blank"
 * means the same thing for both — so it is written once here rather than twice,
 * and a caller catching a blank title catches one error whichever it was naming.
 */

export class EmptyTitleError extends Error {
  constructor() {
    super('A task needs a title.')
    this.name = 'EmptyTitleError'
  }
}

/** The stored form of a title: trimmed, and never blank. */
export function normalizeTitle(title: string): string {
  const trimmed = title.trim()
  if (trimmed.length === 0) {
    throw new EmptyTitleError()
  }

  return trimmed
}

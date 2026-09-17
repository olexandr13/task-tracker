/**
 * Tags: short names a task carries, any number of them, so tasks that belong
 * together can be seen together wherever they are due.
 *
 * A tag is not a record of its own. It is a name written on the tasks that
 * carry it, and the tags there are are the names the tasks carry — so a tag
 * comes into being on the first task given it and goes with the last. Anything
 * a tag later needs of its own, a colour say, can be kept beside the tasks by
 * name without changing what a task holds.
 */

import { isComplete, type Task } from './task'

/**
 * What a tag name may not hold: whitespace, which ends one where it is typed as
 * `#name`, and `\ / " # : * ? < > | ,`, which TickTick refuses as well. The
 * slash is kept free for tags nested under others, should they come.
 */
const NOT_IN_A_TAG = /[\s\\/"#:*?<>|,]/u

/** A `#` starting a word, and the name typed after it so far, up to the caret. */
const TYPED_TAG = /(?:^|\s)#([^\s\\/"#:*?<>|,]*)$/u

export class InvalidTagError extends Error {
  constructor(name: string) {
    super(`"${name}" is not a tag name: a tag is one word, without \\ / " # : * ? < > | or commas.`)
    this.name = 'InvalidTagError'
  }
}

/** Whether `name`, as it stands, can be a tag: one word, nothing it may not hold. */
export function isTagName(name: string): boolean {
  return name.length > 0 && !NOT_IN_A_TAG.test(name)
}

/**
 * The stored form of a tag name: trimmed, without the `#` it may be typed with,
 * and a name a tag can have.
 */
export function normalizeTag(name: string): string {
  const bare = name.trim().replace(/^#+/u, '')
  if (!isTagName(bare)) {
    throw new InvalidTagError(name)
  }

  return bare
}

/**
 * Whether two names are the same tag. Case does not make another one: `Work`
 * and `work` are one tag, spelled the way it was first written.
 */
export function sameTag(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase()
}

export function hasTag(task: Task, name: string): boolean {
  return task.tags.some((tag) => sameTag(tag, name))
}

export function hasTags(task: Task): boolean {
  return task.tags.length > 0
}

/**
 * Puts a tag on the task, at the end of the ones it has. A name already known —
 * `known` is every tag there is — keeps the spelling it has there, so one tag is
 * never written two ways. A task that has the tag already is left as it is.
 *
 * Returns a new task; the one passed in is never modified.
 */
export function addTag(task: Task, name: string, known: readonly string[] = []): Task {
  const bare = normalizeTag(name)
  if (hasTag(task, bare)) {
    return task
  }

  const spelled = known.find((tag) => sameTag(tag, bare)) ?? bare
  return { ...task, tags: [...task.tags, spelled] }
}

/**
 * Takes a tag off the task, whatever case it is named in. Nothing else about the
 * task changes. Returns a new task; the one passed in is never modified.
 */
export function removeTag(task: Task, name: string): Task {
  const kept = task.tags.filter((tag) => !sameTag(tag, name))
  return kept.length === task.tags.length ? task : { ...task, tags: kept }
}

/**
 * Deletes a tag: takes it off every task carrying it, in the trash too, so
 * restoring one never brings it back. The tasks themselves stay. A task without
 * the tag is handed back as it was, so only the ones that carried it change.
 *
 * Returns a new list; the one passed in is never modified.
 */
export function deleteTag(tasks: readonly Task[], name: string): Task[] {
  return tasks.map((task) => removeTag(task, name))
}

/** Every tag the tasks carry, once each, in alphabetical order. */
export function tagsInUse(tasks: readonly Task[]): string[] {
  return distinctTags(tasks.flatMap((task) => task.tags))
}

export interface TagSummary {
  readonly name: string
  /** How many of the tasks carrying it are still to do. */
  readonly open: number
}

/**
 * Every tag the tasks carry, as `tagsInUse` has them, with how many of its tasks
 * are still to do as of `now` — a repeating one for its current occurrence.
 */
export function summarizeTags(tasks: readonly Task[], now: Date = new Date()): TagSummary[] {
  return tagsInUse(tasks).map((name) => ({
    name,
    open: tasks.filter((task) => hasTag(task, name) && !isComplete(task, now)).length,
  }))
}

/**
 * The names given, once each whatever their case, in alphabetical order. Where
 * one tag is written two ways — two devices each making it — the spelling that
 * sorts first stands for both.
 */
export function distinctTags(names: readonly string[]): string[] {
  const sorted = [...names].sort((a, b) => a.localeCompare(b))

  return sorted.filter((name, index) => sorted.findIndex((other) => sameTag(other, name)) === index)
}

/**
 * The tags matching what has been typed, best first: the tag of that very name,
 * then those starting with it, then those holding it anywhere. Case is ignored,
 * and nothing typed matches every tag. Within each, `tags` keeps its own order.
 */
export function matchTags(tags: readonly string[], query: string): string[] {
  const typed = query.toLowerCase()
  const rank = (tag: string) => {
    const name = tag.toLowerCase()
    if (name === typed) return 0
    return name.startsWith(typed) ? 1 : 2
  }

  return tags
    .filter((tag) => tag.toLowerCase().includes(typed))
    .map((tag, index) => ({ tag, index, rank: rank(tag) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ tag }) => tag)
}

export interface TagSuggestion {
  readonly name: string
  /** Whether choosing it makes a tag that no task carries yet. */
  readonly isNew: boolean
}

/**
 * What to offer for a tag being typed: the known tags matching it that the task
 * does not carry already, then — when what is typed is a tag name and no tag has
 * it — a new tag of that name.
 */
export function suggestTags(known: readonly string[], query: string, taken: readonly string[]): TagSuggestion[] {
  const free = known.filter((tag) => !taken.some((name) => sameTag(name, tag)))
  const matches = matchTags(free, query).map((name) => ({ name, isNew: false }))
  const isKnown = [...known, ...taken].some((tag) => sameTag(tag, query))

  return isTagName(query) && !isKnown ? [...matches, { name: query, isNew: true }] : matches
}

/**
 * The tag being typed at the end of `text` — what a line holds up to the caret —
 * or null when none is. A tag is typed as `#` at the start of a word and the
 * name after it, so `#` alone is a tag begun with nothing typed yet (`''`), and
 * a `#` inside a word, as in `C#`, is not one.
 */
export function typedTag(text: string): string | null {
  return TYPED_TAG.exec(text)?.[1] ?? null
}

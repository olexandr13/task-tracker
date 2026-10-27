import type { LocalDay, XpProgress } from '../core'

/** What one change adds to where XP stands. */
export interface XpAddition {
  /** XP gained, or lost below zero. */
  readonly xp: number
  /** How many tasks the day has added now, where the change added or took back any (LVL-4). */
  readonly adds: { readonly on: LocalDay; readonly count: number } | null
}

/** What the days gone by came to, as counted against where XP stood, or null for nothing to count. */
export type XpSettling = (progress: XpProgress) => { readonly xp: number; readonly settledThrough: LocalDay } | null

/**
 * Where an account's XP stands (LVL-1): one record, and no history. Every call
 * site talks to this interface rather than to the service behind it, as with
 * the tasks (./taskRepository).
 */
export interface XpRepository {
  /**
   * Calls back with where XP stands once it is known — null while it has not
   * begun — and again whenever it changes, here or on another device. Returns
   * the way to stop.
   */
  subscribe(onProgress: (progress: XpProgress | null) => void, onError: (error: unknown) => void): () => void
  /** Begins XP on `day` where it has not begun, moving in what an older version kept (STORE-5). */
  begin(day: LocalDay): Promise<void>
  /** Adds what a change gave or took. Two devices adding at once both count. */
  add(addition: XpAddition): Promise<void>
  /**
   * Counts the days gone by against where XP stands as it is saved, at once, so
   * two devices counting the same days count them once (LVL-12 to LVL-14).
   */
  settle(count: XpSettling): Promise<void>
  /**
   * Raises the XP kept to `least` where it is below it, against the record as
   * saved, so two devices raising it at once raise it once (LVL-17).
   */
  lift(least: number): Promise<void>
  /** Takes on where XP stands from elsewhere — the guest's, a backup file's — only where it has not begun already. */
  importProgress(progress: XpProgress): Promise<void>
}

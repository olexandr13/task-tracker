/**
 * The page as it was drawn when it was last left (UI-86), so a reload can show
 * it again while the reloaded page gathers what it shows.
 */
export interface PageSnapshot {
  /** Where it was: the path and the view in the address (UI-36). */
  readonly address: string
  /** The local day it was drawn on, as `toLocalDay` in ../core writes them. */
  readonly day: string
  /** Whether it was laid out as a phone's (`PHONE_QUERY`). */
  readonly phone: boolean
  /** The markup inside the page's root. */
  readonly html: string
}

/** Where the page as it was left is kept: in this tab alone, and only until it is closed (STORE-68). */
export interface PageSnapshotRepository {
  load(): PageSnapshot | null
  /** Keeps `snapshot` in place of whatever was kept before, or nothing for null. */
  save(snapshot: PageSnapshot | null): void
}

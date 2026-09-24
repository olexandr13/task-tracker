import {
  BONUS_PERIODS,
  isExpired,
  sameTag,
  type List,
  type ListId,
  type LocalDay,
  type PeriodBonuses,
  type PointValue,
  type Prize,
  type PrizeId,
  type Redemption,
  type RedemptionId,
  type RewardEntry,
  type Tag,
  type TagId,
  type Task,
  type TaskId,
  type WarmUp,
} from '../core'

/**
 * Everything an account keeps, in today's shapes: the tasks — the trash too —
 * the lists they are filed under, the kept tags, the wishlist, and the points
 * ledger. What is kept on the device alone (the View options, the sidebar, the
 * cached quote) is not the account's, and is not in here.
 */
export interface AccountData {
  readonly tasks: readonly Task[]
  readonly lists: readonly List[]
  /** The kept tags (./tagRepository), including those no task carries any more. */
  readonly tags: readonly Tag[]
  /** The prizes points are saved up for (./prizeRepository). */
  readonly prizes: readonly Prize[]
  /** What completions earned (./rewardRepository). */
  readonly entries: readonly RewardEntry[]
  readonly redemptions: readonly Redemption[]
  /**
   * What clearing each period earns (RWD-24, RWD-29), null where nothing does.
   * Settings rather than records: they are counted as none of them, and an
   * import takes one only where the account has none of its own.
   */
  readonly bonuses: PeriodBonuses
  /** What one point is worth (RWD-31), or null while nothing says. A setting, as the bonuses are. */
  readonly pointValue: PointValue | null
  /**
   * The warm-up under way, or null for none (WARM-1). A setting again: it is
   * counted as none of the records, and an import takes it only where the
   * account has none of its own.
   */
  readonly warmUp: WarmUp | null
}

/** How many of each kind of record there are. A completion is one entry of the ledger. */
export interface RecordCounts {
  readonly tasks: number
  readonly lists: number
  readonly tags: number
  readonly prizes: number
  readonly completions: number
  readonly redemptions: number
}

/** What an import came to. */
export interface ImportSummary {
  readonly added: RecordCounts
  /** Records the account had already, left as they are. */
  readonly alreadyHere: number
}

/** An import asks the service what the account holds, so it cannot go ahead offline. */
export class NeedsConnectionError extends Error {
  constructor() {
    super('Importing needs a connection: the account has to be asked what it already holds.')
    this.name = 'NeedsConnectionError'
  }
}

/**
 * Where an account's data is read whole and added to whole — the other side of
 * a backup file (./backupFile). Every call site talks to this interface rather
 * than to the service behind it, as with the tasks (./taskRepository).
 */
export interface BackupRepository {
  /** Everything the account holds that the app can read. Offline, what this device has of it. */
  exportAll(): Promise<AccountData>
  /**
   * Adds the records the account does not have yet (`newRecords`) and leaves
   * every one it has as it is. Asks the service rather than the copy in the
   * browser, which on a device new to the account is empty and would let an
   * old file overwrite newer work — so it throws `NeedsConnectionError` offline.
   */
  importAll(data: AccountData, now: Date): Promise<ImportSummary>
}

/** What the account already holds, by id: enough to tell a record in a file from one already here. */
export interface KnownRecords {
  readonly taskIds: ReadonlySet<TaskId>
  readonly listIds: ReadonlySet<ListId>
  readonly tagIds: ReadonlySet<TagId>
  /** The names of the tags kept already, readable ones: a tag is found by its name (../core/tag). */
  readonly tagNames: readonly string[]
  readonly prizeIds: ReadonlySet<PrizeId>
  readonly redemptionIds: ReadonlySet<RedemptionId>
  /** What the account earns for clearing each period already, null where it has no bonus. */
  readonly bonuses: PeriodBonuses
  /** What the account says a point is worth already, or null when it says nothing. */
  readonly pointValue: PointValue | null
  /** The warm-up the account has already, or null when it has none. */
  readonly warmUp: WarmUp | null
  /**
   * The tasks each saved day holds an entry for, or null for a day the app
   * cannot read — which is left as it is, so nothing is added to it.
   */
  readonly days: ReadonlyMap<LocalDay, ReadonlySet<TaskId> | null>
}

export function countRecords(data: AccountData): RecordCounts {
  return {
    tasks: data.tasks.length,
    lists: data.lists.length,
    tags: data.tags.length,
    prizes: data.prizes.length,
    completions: data.entries.length,
    redemptions: data.redemptions.length,
  }
}

/**
 * The records in `incoming` the account does not have yet, and how many it
 * has already. A record is the account's already when one with its id is there,
 * readable or not, so an import never overwrites anything; a completion is
 * there when its day holds an entry for its task. The same record twice in
 * `incoming` is taken once.
 *
 * A task whose time in the trash ran out since the file was made is left out:
 * it would only be purged again the moment it arrived (`purgeExpired`). A tag
 * is the account's already when a tag of its name is kept, whatever the case,
 * so an import never makes a second record of one tag. The bonuses and what a
 * point is worth are the things in here that are no records: the file's are
 * taken only where the account has none, and count towards neither what was
 * added nor what was already here. So is the warm-up: a file's is taken only
 * by an account with none of its own, which keeps a restored backup from
 * starting a month that has already been served.
 */
export function newRecords(
  incoming: AccountData,
  known: KnownRecords,
  now: Date,
): { fresh: AccountData; alreadyHere: number } {
  let alreadyHere = 0

  function unseen<T>(records: readonly T[], idOf: (record: T) => string, taken: ReadonlySet<string>): T[] {
    const seen = new Set<string>()
    return records.filter((record) => {
      const id = idOf(record)
      if (taken.has(id)) {
        alreadyHere += 1
        return false
      }
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })
  }

  const entryKey = (entry: RewardEntry) => `${entry.day}/${entry.taskId}`
  const takenEntries = new Set<string>()
  for (const entry of incoming.entries) {
    const day = known.days.get(entry.day)
    if (day === null || day?.has(entry.taskId) === true) takenEntries.add(entryKey(entry))
  }

  const tagNames = [...known.tagNames]
  const tags = unseen(incoming.tags, (tag) => tag.id, known.tagIds).filter((tag) => {
    if (known.tagNames.some((name) => sameTag(name, tag.name))) {
      alreadyHere += 1
      return false
    }
    if (tagNames.some((name) => sameTag(name, tag.name))) return false
    tagNames.push(tag.name)
    return true
  })

  const bonuses = Object.fromEntries(
    BONUS_PERIODS.map((period) => [period, known.bonuses[period] === null ? incoming.bonuses[period] : null]),
  ) as PeriodBonuses

  return {
    fresh: {
      tasks: unseen(incoming.tasks, (task) => task.id, known.taskIds).filter((task) => !isExpired(task, now)),
      lists: unseen(incoming.lists, (list) => list.id, known.listIds),
      tags,
      prizes: unseen(incoming.prizes, (prize) => prize.id, known.prizeIds),
      entries: unseen(incoming.entries, entryKey, takenEntries),
      redemptions: unseen(incoming.redemptions, (redemption) => redemption.id, known.redemptionIds),
      bonuses,
      pointValue: known.pointValue === null ? incoming.pointValue : null,
      warmUp: known.warmUp === null ? incoming.warmUp : null,
    },
    alreadyHere,
  }
}

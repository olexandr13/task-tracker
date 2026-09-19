import {
  isExpired,
  type List,
  type ListId,
  type LocalDay,
  type Redemption,
  type RedemptionId,
  type RewardEntry,
  type Task,
  type TaskId,
} from '../core'

/**
 * Everything an account keeps, in today's shapes: the tasks — the trash too —
 * the lists they are filed under, and the points ledger. What is kept on the
 * device alone (the View options, the sidebar, the cached quote) is not the
 * account's, and is not in here.
 */
export interface AccountData {
  readonly tasks: readonly Task[]
  readonly lists: readonly List[]
  /** What completions earned (./rewardRepository). */
  readonly entries: readonly RewardEntry[]
  readonly redemptions: readonly Redemption[]
}

/** How many of each kind of record there are. A completion is one entry of the ledger. */
export interface RecordCounts {
  readonly tasks: number
  readonly lists: number
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
  readonly redemptionIds: ReadonlySet<RedemptionId>
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
 * it would only be purged again the moment it arrived (`purgeExpired`).
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

  return {
    fresh: {
      tasks: unseen(incoming.tasks, (task) => task.id, known.taskIds).filter((task) => !isExpired(task, now)),
      lists: unseen(incoming.lists, (list) => list.id, known.listIds),
      entries: unseen(incoming.entries, entryKey, takenEntries),
      redemptions: unseen(incoming.redemptions, (redemption) => redemption.id, known.redemptionIds),
    },
    alreadyHere,
  }
}

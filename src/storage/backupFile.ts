import { toLocalDay, type List, type Redemption, type RewardEntry, type Tag, type Task } from '../core'
import type { AccountData } from './backupRepository'
import { readList, toStoredList, type StoredList } from './listSchema'
import { isRecord } from './plainData'
import {
  readRedemption,
  readRewardDay,
  toStoredRedemption,
  toStoredRewardDays,
  type StoredRedemption,
  type StoredRewardDay,
} from './rewardSchema'
import { readTag, toStoredTag, type StoredTag } from './tagSchema'
import { readStoredTask, toStoredTask, type StoredTask } from './taskSchema'

/** What a backup says it is, so any other JSON file is turned away rather than half read. */
export const BACKUP_FORMAT = 'task-tracker-backup'

/**
 * The shape of the file around the records. Its own version: every record in
 * it keeps the version it is saved under (./taskSchema, ./listSchema,
 * ./rewardSchema), so a record in a file made by an older app is upgraded by
 * the same steps as one saved in the account, and this only changes when the
 * wrapper does.
 *
 * Version 1 held no tags: a file made before the kept tags were backed up is
 * read as keeping none, and the tags its tasks carry are kept again on arrival.
 */
export const BACKUP_VERSION = 2

interface BackupFile {
  format: typeof BACKUP_FORMAT
  version: number
  /** ISO 8601 timestamp. */
  exportedAt: string
  tasks: StoredTask[]
  lists: StoredList[]
  tags: StoredTag[]
  rewardDays: StoredRewardDay[]
  redemptions: StoredRedemption[]
}

/** Why a file was not read at all. */
export type BackupFailure = 'not-a-backup' | 'newer-version'

export interface BackupRead {
  readonly data: AccountData
  /** Records in the file the app could not read — an unknown version, or not shaped as they should be. */
  readonly unreadable: number
}

/** `task-tracker-backup-2026-09-19.json`, by the local day it was made. */
export function backupFileName(now: Date): string {
  return `task-tracker-backup-${toLocalDay(now)}.json`
}

/** The account's data as the text of a backup file, indented so a person can read it too. */
export function writeBackupFile(data: AccountData, now: Date): string {
  const file: BackupFile = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    tasks: data.tasks.map(toStoredTask),
    lists: data.lists.map(toStoredList),
    tags: data.tags.map(toStoredTag),
    rewardDays: toStoredRewardDays(data.entries),
    redemptions: data.redemptions.map(toStoredRedemption),
  }
  return `${JSON.stringify(file, null, 2)}\n`
}

/**
 * The records in a backup file, in today's shapes, or why the file was not read.
 * A record that cannot be read is left out and counted, as a saved one would be
 * (STORE-7), rather than costing the rest of the file.
 */
export function readBackupFile(text: string): BackupRead | BackupFailure {
  let file: unknown
  try {
    file = JSON.parse(text)
  } catch {
    return 'not-a-backup'
  }

  if (!isRecord(file) || file.format !== BACKUP_FORMAT || typeof file.version !== 'number') return 'not-a-backup'
  if (file.version > BACKUP_VERSION) return 'newer-version'
  if (file.version !== 1 && file.version !== BACKUP_VERSION) return 'not-a-backup'

  const { tasks, lists, rewardDays, redemptions } = file
  const tags = file.version === 1 ? [] : file.tags
  if (
    !Array.isArray(tasks) ||
    !Array.isArray(lists) ||
    !Array.isArray(tags) ||
    !Array.isArray(rewardDays) ||
    !Array.isArray(redemptions)
  ) {
    return 'not-a-backup'
  }

  let unreadable = 0
  function readEach<T>(records: unknown[], read: (record: unknown) => T | null): T[] {
    return records.flatMap((record) => {
      const value = read(record)
      if (value === null) unreadable += 1
      return value === null ? [] : [value]
    })
  }

  const data: AccountData = {
    tasks: readEach<Task>(tasks, readStoredTask),
    lists: readEach<List>(lists, readList),
    tags: readEach<Tag>(tags, readTag),
    entries: readEach<RewardEntry[]>(rewardDays, readRewardDay).flat(),
    redemptions: readEach<Redemption>(redemptions, readRedemption),
  }
  return { data, unreadable }
}

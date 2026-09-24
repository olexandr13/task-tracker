import {
  BONUS_PERIODS,
  NO_BONUSES,
  toLocalDay,
  type List,
  type PeriodBonuses,
  type Prize,
  type Redemption,
  type RewardEntry,
  type Tag,
  type Task,
  type WarmUp,
} from '../core'
import type { AccountData } from './backupRepository'
import { readList, toStoredList, type StoredList } from './listSchema'
import { isRecord } from './plainData'
import { readPrize, toStoredPrize, type StoredPrize } from './prizeSchema'
import {
  readPointValue,
  readRedemption,
  readRewardDay,
  readRewardGoal,
  toStoredPointValue,
  toStoredRedemption,
  toStoredRewardDays,
  toStoredRewardGoal,
  type StoredPointValue,
  type StoredRedemption,
  type StoredRewardDay,
  type StoredRewardGoal,
} from './rewardSchema'
import { readTag, toStoredTag, type StoredTag } from './tagSchema'
import { readStoredTask, toStoredTask, type StoredTask } from './taskSchema'
import { readWarmUp, toStoredWarmUp, type StoredWarmUp } from './warmUpSchema'

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
 * Version 2 held no bonus for clearing a period (RWD-24): a file made before
 * there was one is read as setting none. Version 3 held no wishlist and no
 * point value (RWD-31, RWD-33): a file made before those is read as holding no
 * prizes and setting no value. Version 4 held no warm-up (WARM-1): a file made
 * before there was one is read as having none under way.
 */
export const BACKUP_VERSION = 5

/** The versions of the wrapper this app can still read, oldest first. */
const READABLE_VERSIONS = [1, 2, 3, 4, BACKUP_VERSION]

interface BackupFile {
  format: typeof BACKUP_FORMAT
  version: number
  /** ISO 8601 timestamp. */
  exportedAt: string
  tasks: StoredTask[]
  lists: StoredList[]
  tags: StoredTag[]
  /** The wishlist, one record per prize (RWD-33). */
  prizes: StoredPrize[]
  rewardDays: StoredRewardDay[]
  redemptions: StoredRedemption[]
  /** What clearing a period earns, one record per period that has a bonus (RWD-24, RWD-29). */
  rewardGoals: StoredRewardGoal[]
  /** The standing settings of the points: what one is worth, where anything says (RWD-31). */
  rewardSettings: StoredPointValue[]
  /** The warm-up under way, as its one record, or nothing at all for none (WARM-1). */
  warmUp: StoredWarmUp[]
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
    prizes: data.prizes.map(toStoredPrize),
    rewardDays: toStoredRewardDays(data.entries),
    redemptions: data.redemptions.map(toStoredRedemption),
    rewardGoals: BONUS_PERIODS.flatMap((period) => {
      const points = data.bonuses[period]
      return points === null ? [] : [toStoredRewardGoal(period, points)]
    }),
    rewardSettings: data.pointValue === null ? [] : [toStoredPointValue(data.pointValue)],
    warmUp: data.warmUp === null ? [] : [toStoredWarmUp(data.warmUp)],
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
  if (!READABLE_VERSIONS.includes(file.version)) return 'not-a-backup'

  const { tasks, lists, rewardDays, redemptions } = file
  // What an older wrapper did not hold is read as empty rather than missing.
  const tags = file.version === 1 ? [] : file.tags
  const rewardGoals = file.version < 3 ? [] : file.rewardGoals
  const prizes = file.version < 4 ? [] : file.prizes
  const rewardSettings = file.version < 4 ? [] : file.rewardSettings
  const warmUp = file.version < 5 ? [] : file.warmUp
  if (
    !Array.isArray(tasks) ||
    !Array.isArray(lists) ||
    !Array.isArray(tags) ||
    !Array.isArray(prizes) ||
    !Array.isArray(rewardDays) ||
    !Array.isArray(redemptions) ||
    !Array.isArray(rewardGoals) ||
    !Array.isArray(rewardSettings) ||
    !Array.isArray(warmUp)
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

  const goals = readEach(rewardGoals, readRewardGoal)
  const bonuses = { ...NO_BONUSES } as Record<string, number | null>
  for (const goal of goals) bonuses[goal.period] = goal.points

  const data: AccountData = {
    tasks: readEach<Task>(tasks, readStoredTask),
    lists: readEach<List>(lists, readList),
    tags: readEach<Tag>(tags, readTag),
    prizes: readEach<Prize>(prizes, readPrize),
    entries: readEach<RewardEntry[]>(rewardDays, readRewardDay).flat(),
    redemptions: readEach<Redemption>(redemptions, readRedemption),
    bonuses: bonuses as PeriodBonuses,
    pointValue: readEach(rewardSettings, readPointValue)[0] ?? null,
    warmUp: readEach<WarmUp>(warmUp, readWarmUp)[0] ?? null,
  }
  return { data, unreadable }
}

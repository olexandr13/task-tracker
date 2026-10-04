import {
  BONUS_PERIODS,
  type ActivityEntry,
  NO_BONUSES,
  toLocalDay,
  type Category,
  type CaseSettings,
  type FeaturesOff,
  type List,
  type PeriodBonuses,
  type Prize,
  type PointValue,
  type Redemption,
  type RewardEntry,
  type Tag,
  type Task,
  type WarmUp,
} from '../core'
import { readActivityDay, toStoredActivityDays, type StoredActivityDay } from './activitySchema'
import type { AccountData } from './backupRepository'
import { readCategory, toStoredCategory, type StoredCategory } from './categorySchema'
import type { CheckInPreference } from './checkInRepository'
import { readCheckIn, toStoredCheckIn, type StoredCheckIn } from './checkInSchema'
import { readFeatures, toStoredFeatures, type StoredFeatures } from './featureSchema'
import { readList, toStoredList, type StoredList } from './listSchema'
import type { NudgePreference } from './nudgeRepository'
import { readNudge, toStoredNudge, type StoredNudge } from './nudgeSchema'
import { isRecord } from './plainData'
import { readPrize, toStoredPrize, type StoredPrize } from './prizeSchema'
import {
  readCaseSettings,
  readPointValue,
  readRedemption,
  readRewardDay,
  readRewardGoal,
  toStoredCaseSettings,
  toStoredPointValue,
  toStoredRedemption,
  toStoredRewardDays,
  toStoredRewardGoal,
  type StoredCaseSettings,
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
 * before there was one is read as having none under way. Version 5 held no
 * nudge setting (NUDGE-9), which was the device's then rather than the
 * account's (STORE-46): a file made before it synced is read as asking for none.
 * Version 6 held no Balance categories (BAL-12): a file made before there were
 * any is read as holding none. Version 7 held no activity log and no check-in
 * (ACT-1, CHECKIN-2): a file made before them is read as holding no records and
 * asking for no check-in. Version 8 held no feature switches (FEAT-1): a file
 * made before there were any is read as switching nothing off.
 */
export const BACKUP_VERSION = 9

/** The versions of the wrapper this app can still read, oldest first. */
const READABLE_VERSIONS = [1, 2, 3, 4, 5, 6, 7, 8, BACKUP_VERSION]

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
  /** The Balance page's categories, one record each (BAL-12). */
  categories: StoredCategory[]
  rewardDays: StoredRewardDay[]
  redemptions: StoredRedemption[]
  /** What clearing a period earns, one record per period that has a bonus (RWD-24, RWD-29). */
  rewardGoals: StoredRewardGoal[]
  /**
   * The standing settings of the points, a record each where anything says: what
   * one point is worth (RWD-31), and what Cases asks of a day (CHST-3).
   * A new kind of setting joins this array and leaves the wrapper as it is, so
   * `BACKUP_VERSION` does not move for one — a file without Cases' record
   * is read as saying nothing about it, as a file without the point value is.
   */
  rewardSettings: (StoredPointValue | StoredCaseSettings)[]
  /** The warm-up under way, as its one record, or nothing at all for none (WARM-1). */
  warmUp: StoredWarmUp[]
  /** How the owner asked to be nudged, as its one record, or nothing at all where it is off (NUDGE-9). */
  nudge: StoredNudge[]
  /** The activity log, a day at a time, as the account keeps it (STORE-51). */
  activityDays: StoredActivityDay[]
  /** Whether the check-in is on and its hours, as its one record, or nothing at all at its defaults (CHECKIN-2). */
  checkIn: StoredCheckIn[]
  /** The features switched off on Settings, as their one record, or nothing at all with every one on (FEAT-1). */
  features: StoredFeatures[]
}

/** Why a file was not read at all. */
export type BackupFailure = 'not-a-backup' | 'newer-version'

export interface BackupRead {
  readonly data: AccountData
  /** Records in the file the app could not read — an unknown version, or not shaped as they should be. */
  readonly unreadable: number
}

/** The nudge setting as the file holds it: its one record, or nothing at all where it is off. */
function nudgeRecord(preference: NudgePreference | null): StoredNudge[] {
  const stored = preference === null ? null : toStoredNudge(preference)
  return stored === null ? [] : [stored]
}

/** The check-in setting as the file holds it: its one record, or nothing at all at its defaults. */
function checkInRecord(preference: CheckInPreference | null): StoredCheckIn[] {
  const stored = preference === null ? null : toStoredCheckIn(preference)
  return stored === null ? [] : [stored]
}

/** The feature switches as the file holds them: their one record, or nothing at all with every feature on. */
function featuresRecord(off: FeaturesOff | null): StoredFeatures[] {
  const stored = off === null ? null : toStoredFeatures(off)
  return stored === null ? [] : [stored]
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
    categories: data.categories.map(toStoredCategory),
    rewardDays: toStoredRewardDays(data.entries),
    redemptions: data.redemptions.map(toStoredRedemption),
    rewardGoals: BONUS_PERIODS.flatMap((period) => {
      const points = data.bonuses[period]
      return points === null ? [] : [toStoredRewardGoal(period, points)]
    }),
    rewardSettings: [
      ...(data.pointValue === null ? [] : [toStoredPointValue(data.pointValue)]),
      ...(data.cases === null ? [] : [toStoredCaseSettings(data.cases)]),
    ],
    warmUp: data.warmUp === null ? [] : [toStoredWarmUp(data.warmUp)],
    // A nudge back at its defaults keeps no record here either, as it keeps none in the account.
    nudge: nudgeRecord(data.nudge),
    activityDays: toStoredActivityDays(data.activities),
    checkIn: checkInRecord(data.checkIn),
    features: featuresRecord(data.features),
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
  const nudge = file.version < 6 ? [] : file.nudge
  const categories = file.version < 7 ? [] : file.categories
  const activityDays = file.version < 8 ? [] : file.activityDays
  const checkIn = file.version < 8 ? [] : file.checkIn
  const features = file.version < 9 ? [] : file.features
  if (
    !Array.isArray(tasks) ||
    !Array.isArray(lists) ||
    !Array.isArray(tags) ||
    !Array.isArray(prizes) ||
    !Array.isArray(rewardDays) ||
    !Array.isArray(redemptions) ||
    !Array.isArray(rewardGoals) ||
    !Array.isArray(rewardSettings) ||
    !Array.isArray(warmUp) ||
    !Array.isArray(nudge) ||
    !Array.isArray(categories) ||
    !Array.isArray(activityDays) ||
    !Array.isArray(checkIn) ||
    !Array.isArray(features)
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

  // A settings record is one kind or the other, so it is only unreadable when
  // neither reader can make anything of it.
  let pointValue: PointValue | null = null
  let cases: CaseSettings | null = null
  for (const record of rewardSettings) {
    const value = readPointValue(record)
    const asked = readCaseSettings(record)
    if (value !== null) pointValue ??= value
    else if (asked !== null) cases ??= asked
    else unreadable += 1
  }

  const goals = readEach(rewardGoals, readRewardGoal)
  const bonuses = { ...NO_BONUSES } as Record<string, number | null>
  for (const goal of goals) bonuses[goal.period] = goal.points

  const data: AccountData = {
    tasks: readEach<Task>(tasks, readStoredTask),
    lists: readEach<List>(lists, readList),
    tags: readEach<Tag>(tags, readTag),
    prizes: readEach<Prize>(prizes, readPrize),
    categories: readEach<Category>(categories, readCategory),
    activities: readEach<ActivityEntry[]>(activityDays, readActivityDay).flat(),
    entries: readEach<RewardEntry[]>(rewardDays, readRewardDay).flat(),
    redemptions: readEach<Redemption>(redemptions, readRedemption),
    bonuses: bonuses as PeriodBonuses,
    pointValue,
    cases,
    warmUp: readEach<WarmUp>(warmUp, readWarmUp)[0] ?? null,
    nudge: readEach<NudgePreference>(nudge, readNudge)[0] ?? null,
    checkIn: readEach<CheckInPreference>(checkIn, readCheckIn)[0] ?? null,
    features: readEach<FeaturesOff>(features, readFeatures)[0] ?? null,
  }
  return { data, unreadable }
}

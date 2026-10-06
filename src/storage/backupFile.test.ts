import { describe, expect, it } from 'vitest'
import {
  bindTag,
  completeTask,
  createActivityEntry,
  createCategory,
  createList,
  createPointValue,
  createPrize,
  createRedemption,
  createTag,
  createTask,
  deleteTask,
  NO_BONUSES,
  startWarmUp,
  type PeriodBonuses,
  type RewardEntry,
  type CaseSettings,
} from '../core'
import { backupFileName, BACKUP_FORMAT, BACKUP_VERSION, readBackupFile, writeBackupFile } from './backupFile'
import { ACTIVITY_SCHEMA_VERSION } from './activitySchema'
import type { AccountData } from './backupRepository'
import { CATEGORY_SCHEMA_VERSION } from './categorySchema'
import type { CheckInPreference } from './checkInRepository'
import { CHECK_IN_SCHEMA_VERSION } from './checkInSchema'
import { FEATURES_SCHEMA_VERSION } from './featureSchema'
import { LIST_SCHEMA_VERSION } from './listSchema'
import type { NudgePreference } from './nudgeRepository'
import { NUDGE_SCHEMA_VERSION } from './nudgeSchema'
import { PRIZE_SCHEMA_VERSION } from './prizeSchema'
import { REWARD_SCHEMA_VERSION } from './rewardSchema'
import { TAG_SCHEMA_VERSION } from './tagSchema'
import { SCHEMA_VERSION } from './taskSchema'

/* The backup file: what it holds, and reading one back. BAK ids refer to wiki/backup.md. */

const AT = new Date('2026-09-19T09:00:00.000Z')

const DONE = completeTask(createTask('Write report', null, AT), AT)
const TRASHED = deleteTask(createTask('Old idea', null, AT), AT)
const WORK = createList('Work', AT)
const ERRANDS = createTag('errands', AT)
const ENTRIES: RewardEntry[] = [
  { taskId: DONE.id, day: '2026-09-18', points: 5 },
  { taskId: 'other-task', day: '2026-09-18', points: 2 },
  { taskId: DONE.id, day: '2026-09-19', points: 5 },
]
const TREAT = createRedemption(3, 'Coffee', 12, AT)
const CHOCOLATE = createPrize('Chocolate', 20, 'prize', AT)
const BONUSES: PeriodBonuses = { today: 10, week: 40, month: null }
const UAH = createPointValue(2.5)
const WARMING_UP = startWarmUp(AT)
const NUDGING: NudgePreference = { on: true, quietHours: 3, window: { from: '09:00', to: '22:00' } }
const ASKING: CaseSettings = { leastTasks: 4, countUnpaid: false }
const REST = bindTag(createCategory('Rest', AT), 'walk')
const READING = createActivityEntry('Reading', 900, { day: '2026-09-18', hour: 14 }, AT)
const WORKING = createActivityEntry('Work', 2700, { day: '2026-09-18', hour: 14 }, AT)
const CHECKING_IN: CheckInPreference = { on: true, window: { from: '08:00', to: '20:00' } }

const DATA: AccountData = {
  tasks: [DONE, TRASHED],
  lists: [WORK],
  tags: [ERRANDS],
  prizes: [CHOCOLATE],
  categories: [REST],
  activities: [READING, WORKING],
  entries: ENTRIES,
  redemptions: [TREAT],
  bonuses: BONUSES,
  pointValue: UAH,
  cases: ASKING,
  warmUp: WARMING_UP,
  nudge: NUDGING,
  checkIn: CHECKING_IN,
  features: ['rewards', 'quote'],
}

/** What a file from before the feature switches reads as (BAK-20). */
const BEFORE_FEATURES = { features: null }

/** What a file from before the activity log and the check-in reads as (BAK-18, BAK-19), and so before the switches too. */
const BEFORE_ACTIVITIES = { activities: [], checkIn: null, ...BEFORE_FEATURES }

function fileWith(changes: Record<string, unknown>): string {
  return JSON.stringify({ ...(JSON.parse(writeBackupFile(DATA, AT)) as object), ...changes })
}

describe('writing a backup', () => {
  it('holds every kind of record the account keeps, the trash too (BAK-2)', () => {
    const read = readBackupFile(writeBackupFile(DATA, AT))

    expect(read).toEqual({ data: DATA, unreadable: 0 })
  })

  it('says what it is and when it was made, and keeps each record under its saved version (BAK-3)', () => {
    const file = JSON.parse(writeBackupFile(DATA, AT)) as Record<string, unknown>

    expect(file).toMatchObject({
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: AT.toISOString(),
      tasks: [{ version: SCHEMA_VERSION, task: DONE }, { version: SCHEMA_VERSION, task: TRASHED }],
      lists: [{ version: LIST_SCHEMA_VERSION, list: WORK }],
      tags: [{ version: TAG_SCHEMA_VERSION, tag: ERRANDS }],
      prizes: [{ version: PRIZE_SCHEMA_VERSION, prize: CHOCOLATE }],
      categories: [{ version: CATEGORY_SCHEMA_VERSION, category: REST }],
      redemptions: [{ version: REWARD_SCHEMA_VERSION, redemption: TREAT }],
      rewardGoals: [
        { version: REWARD_SCHEMA_VERSION, goal: { period: 'today', points: 10 } },
        { version: REWARD_SCHEMA_VERSION, goal: { period: 'week', points: 40 } },
      ],
      rewardSettings: [
        { version: REWARD_SCHEMA_VERSION, name: 'pointValue', value: UAH },
        { version: REWARD_SCHEMA_VERSION, name: 'chest', settings: ASKING },
      ],
      nudge: [{ version: NUDGE_SCHEMA_VERSION, name: 'nudge', nudge: NUDGING }],
      checkIn: [{ version: CHECK_IN_SCHEMA_VERSION, name: 'checkIn', checkIn: CHECKING_IN }],
      features: [{ version: FEATURES_SCHEMA_VERSION, name: 'features', off: ['rewards', 'quote'] }],
    })
  })

  it('keeps no record of the switches while every feature is on (BAK-20)', () => {
    const file = JSON.parse(writeBackupFile({ ...DATA, features: [] }, AT)) as { features: unknown }

    expect(file.features).toEqual([])
  })

  it('keeps the activity log a day at a time, as the account does (BAK-18)', () => {
    const file = JSON.parse(writeBackupFile(DATA, AT)) as { activityDays: unknown }

    expect(file.activityDays).toEqual([
      {
        version: ACTIVITY_SCHEMA_VERSION,
        day: '2026-09-18',
        entries: {
          [READING.id]: { activity: 'Reading', seconds: 900, hour: 14, loggedAt: AT.toISOString() },
          [WORKING.id]: { activity: 'Work', seconds: 2700, hour: 14, loggedAt: AT.toISOString() },
        },
      },
    ])
  })

  it('holds no check-in record for one at its defaults (BAK-19)', () => {
    const file = JSON.parse(writeBackupFile({ ...DATA, checkIn: { on: false, window: { from: '09:00', to: '22:00' } } }, AT)) as {
      checkIn: unknown
    }

    expect(file.checkIn).toEqual([])
  })

  it('keeps the points a day at a time, as the account does (BAK-3)', () => {
    const file = JSON.parse(writeBackupFile(DATA, AT)) as { rewardDays: unknown }

    expect(file.rewardDays).toEqual([
      { version: REWARD_SCHEMA_VERSION, day: '2026-09-18', entries: { [DONE.id]: { points: 5 }, 'other-task': { points: 2 } } },
      { version: REWARD_SCHEMA_VERSION, day: '2026-09-19', entries: { [DONE.id]: { points: 5 } } },
    ])
  })

  it('is named for the day it was made (BAK-1)', () => {
    expect(backupFileName(new Date(2026, 8, 19, 23, 30))).toBe('task-tracker-backup-2026-09-19.json')
  })
})

describe('reading a backup', () => {
  it('turns away a file that is not JSON (BAK-9)', () => {
    expect(readBackupFile('not json at all')).toBe('not-a-backup')
  })

  it('turns away JSON that is not a backup (BAK-9)', () => {
    expect(readBackupFile('{"tasks": []}')).toBe('not-a-backup')
    expect(readBackupFile('[]')).toBe('not-a-backup')
    expect(readBackupFile('null')).toBe('not-a-backup')
  })

  it('turns away a backup missing a kind of record (BAK-9)', () => {
    expect(readBackupFile(fileWith({ lists: undefined }))).toBe('not-a-backup')
    expect(readBackupFile(fileWith({ tags: undefined }))).toBe('not-a-backup')
    expect(readBackupFile(fileWith({ prizes: undefined }))).toBe('not-a-backup')
    expect(readBackupFile(fileWith({ categories: undefined }))).toBe('not-a-backup')
    expect(readBackupFile(fileWith({ activityDays: undefined }))).toBe('not-a-backup')
    expect(readBackupFile(fileWith({ checkIn: undefined }))).toBe('not-a-backup')
    expect(readBackupFile(fileWith({ features: undefined }))).toBe('not-a-backup')
  })

  it('reads a file from before tags were backed up as keeping none (BAK-12)', () => {
    const read = readBackupFile(
      fileWith({
        version: 1,
        tags: undefined,
        prizes: undefined,
        rewardGoals: undefined,
        rewardSettings: undefined,
        warmUp: undefined,
        nudge: undefined,
        categories: undefined,
        activityDays: undefined,
        checkIn: undefined,
      }),
    )

    expect(read).toEqual({
      data: {
        ...DATA,
        ...BEFORE_ACTIVITIES,
        tags: [],
        prizes: [],
        categories: [],
        bonuses: NO_BONUSES,
        pointValue: null,
        cases: null,
        warmUp: null,
        nudge: null,
      },
      unreadable: 0,
    })
  })

  it('reads a file from before there was a bonus as setting none (BAK-13)', () => {
    const read = readBackupFile(
      fileWith({
        version: 2,
        prizes: undefined,
        rewardGoals: undefined,
        rewardSettings: undefined,
        warmUp: undefined,
        nudge: undefined,
        categories: undefined,
        activityDays: undefined,
        checkIn: undefined,
      }),
    )

    expect(read).toEqual({
      data: { ...DATA, ...BEFORE_ACTIVITIES, prizes: [], categories: [], bonuses: NO_BONUSES, pointValue: null, cases: null, warmUp: null, nudge: null },
      unreadable: 0,
    })
  })

  it('reads a file from before the wishlist as holding no prizes and no point value (BAK-14)', () => {
    const read = readBackupFile(
      fileWith({
        version: 3,
        prizes: undefined,
        rewardSettings: undefined,
        warmUp: undefined,
        nudge: undefined,
        categories: undefined,
        activityDays: undefined,
        checkIn: undefined,
      }),
    )

    expect(read).toEqual({
      data: { ...DATA, ...BEFORE_ACTIVITIES, prizes: [], categories: [], pointValue: null, cases: null, warmUp: null, nudge: null },
      unreadable: 0,
    })
  })

  it('reads a file from before there was a warm-up as having none under way (BAK-15)', () => {
    const read = readBackupFile(
      fileWith({ version: 4, warmUp: undefined, nudge: undefined, categories: undefined, activityDays: undefined, checkIn: undefined }),
    )

    expect(read).toEqual({
      data: { ...DATA, ...BEFORE_ACTIVITIES, categories: [], warmUp: null, nudge: null },
      unreadable: 0,
    })
  })

  it('reads a warm-up saved before it could be paused as not paused (BAK-15)', () => {
    const read = readBackupFile(
      fileWith({
        warmUp: [{ version: 1, name: 'warmUp', warmUp: { startedOn: '2026-09-01' } }],
      }),
    )

    expect(read).toEqual({
      data: { ...DATA, warmUp: { startedOn: '2026-09-01', pausedOn: null, pausedDays: 0 } },
      unreadable: 0,
    })
  })

  it('reads a file from before the nudge synced as asking for none (BAK-16)', () => {
    // Version 5 kept the nudge on the device, so no file made then holds one.
    const read = readBackupFile(
      fileWith({ version: 5, nudge: undefined, categories: undefined, activityDays: undefined, checkIn: undefined }),
    )

    expect(read).toEqual({ data: { ...DATA, ...BEFORE_ACTIVITIES, categories: [], nudge: null }, unreadable: 0 })
  })

  it('reads a file from before there were Balance categories as holding none (BAK-17)', () => {
    const read = readBackupFile(fileWith({ version: 6, categories: undefined, activityDays: undefined, checkIn: undefined }))

    expect(read).toEqual({ data: { ...DATA, ...BEFORE_ACTIVITIES, categories: [] }, unreadable: 0 })
  })

  it('reads a file from before the activity log as holding none and asking for no check-in (BAK-18, BAK-19)', () => {
    const read = readBackupFile(fileWith({ version: 7, activityDays: undefined, checkIn: undefined }))

    expect(read).toEqual({ data: { ...DATA, ...BEFORE_ACTIVITIES }, unreadable: 0 })
  })

  it('reads a file from before the feature switches as switching nothing off (BAK-20)', () => {
    const read = readBackupFile(fileWith({ version: 8, features: undefined }))

    expect(read).toEqual({ data: { ...DATA, ...BEFORE_FEATURES }, unreadable: 0 })
  })

  it('says so when a backup was made by a newer version of the app (BAK-9)', () => {
    expect(readBackupFile(fileWith({ version: BACKUP_VERSION + 1 }))).toBe('newer-version')
  })

  it('upgrades a task saved in an older shape, as the account would (BAK-8)', () => {
    const { skippedDays: _, ...older } = DONE
    const read = readBackupFile(fileWith({ tasks: [{ version: 12, task: older }] }))

    expect(read).toEqual({ data: { ...DATA, tasks: [{ ...older, skippedDays: [] }] }, unreadable: 0 })
  })

  it('leaves out and counts the records it cannot read, keeping the rest (BAK-8)', () => {
    const read = readBackupFile(
      fileWith({
        tasks: [{ version: SCHEMA_VERSION, task: DONE }, { version: 99, task: TRASHED }, { version: SCHEMA_VERSION, task: {} }],
        lists: [{ version: LIST_SCHEMA_VERSION, list: { ...WORK, name: '' } }],
        tags: [{ version: TAG_SCHEMA_VERSION, tag: { ...ERRANDS, name: 'two words' } }],
        rewardDays: [{ version: REWARD_SCHEMA_VERSION, day: 'someday', entries: {} }],
        redemptions: ['coffee', { version: REWARD_SCHEMA_VERSION, redemption: TREAT }],
        categories: [{ version: CATEGORY_SCHEMA_VERSION, category: { ...REST, tags: ['two words'] } }],
        activityDays: [{ version: ACTIVITY_SCHEMA_VERSION, day: '2026-09-18', entries: { x: { activity: '', seconds: 60, hour: 9 } } }],
        checkIn: [{ version: CHECK_IN_SCHEMA_VERSION, name: 'checkIn', checkIn: { on: true, window: { from: '09:30', to: '22:00' } } }],
        features: [{ version: FEATURES_SCHEMA_VERSION + 1, name: 'features', off: ['quote'] }],
      }),
    )

    expect(read).toEqual({
      data: {
        tasks: [DONE],
        lists: [],
        tags: [],
        prizes: [CHOCOLATE],
        categories: [],
        activities: [],
        entries: [],
        redemptions: [TREAT],
        bonuses: BONUSES,
        pointValue: UAH,
        cases: ASKING,
        warmUp: WARMING_UP,
        nudge: NUDGING,
        checkIn: null,
        features: null,
      },
      unreadable: 10,
    })
  })
})

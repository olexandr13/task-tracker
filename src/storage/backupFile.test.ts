import { describe, expect, it } from 'vitest'
import { completeTask, createList, createRedemption, createTag, createTask, deleteTask, type RewardEntry } from '../core'
import { backupFileName, BACKUP_FORMAT, BACKUP_VERSION, readBackupFile, writeBackupFile } from './backupFile'
import type { AccountData } from './backupRepository'
import { LIST_SCHEMA_VERSION } from './listSchema'
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

const DATA: AccountData = {
  tasks: [DONE, TRASHED],
  lists: [WORK],
  tags: [ERRANDS],
  entries: ENTRIES,
  redemptions: [TREAT],
  todayBonus: 10,
}

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
      redemptions: [{ version: REWARD_SCHEMA_VERSION, redemption: TREAT }],
    })
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
  })

  it('reads a file from before tags were backed up as keeping none (BAK-12)', () => {
    const read = readBackupFile(fileWith({ version: 1, tags: undefined }))

    expect(read).toEqual({ data: { ...DATA, tags: [] }, unreadable: 0 })
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
      }),
    )

    expect(read).toEqual({
      data: { tasks: [DONE], lists: [], tags: [], entries: [], redemptions: [TREAT], todayBonus: null },
      unreadable: 6,
    })
  })
})

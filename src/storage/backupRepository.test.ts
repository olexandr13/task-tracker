import { describe, expect, it } from 'vitest'
import {
  createList,
  createPointValue,
  createPrize,
  createRedemption,
  createTag,
  createTask,
  deleteTask,
  NO_BONUSES,
  renameTask,
  TRASH_RETENTION_MS,
} from '../core'
import { countRecords, newRecords, type AccountData, type KnownRecords } from './backupRepository'

/* What an import adds to the account. BAK ids refer to wiki/backup.md. */

const AT = new Date('2026-09-19T09:00:00.000Z')

const WRITE = createTask('Write report', null, AT)
const CALL = createTask('Call mum', null, AT)
const WORK = createList('Work', AT)
const HOME = createList('Home', AT)
const COFFEE = createRedemption(3, 'Coffee', 12, AT)
const ERRANDS = createTag('errands', AT)
const GARDEN = createTag('garden', AT)
const CHOCOLATE = createPrize('Chocolate', 20, 'prize', AT)
const UAH = createPointValue(2.5)

const EMPTY: AccountData = {
  tasks: [],
  lists: [],
  tags: [],
  prizes: [],
  entries: [],
  redemptions: [],
  bonuses: NO_BONUSES,
  pointValue: null,
}

const NOTHING_KNOWN: KnownRecords = {
  taskIds: new Set(),
  listIds: new Set(),
  tagIds: new Set(),
  tagNames: [],
  prizeIds: new Set(),
  redemptionIds: new Set(),
  bonuses: NO_BONUSES,
  pointValue: null,
  days: new Map(),
}

describe('what an import adds', () => {
  it('adds everything to an account that has none of it (BAK-5)', () => {
    const incoming: AccountData = {
      tasks: [WRITE, CALL],
      lists: [WORK],
      tags: [ERRANDS],
      prizes: [CHOCOLATE],
      entries: [{ taskId: WRITE.id, day: '2026-09-19', points: 5 }],
      redemptions: [COFFEE],
      bonuses: { today: 10, week: 40, month: null },
      pointValue: UAH,
    }

    expect(newRecords(incoming, NOTHING_KNOWN, AT)).toEqual({ fresh: incoming, alreadyHere: 0 })
  })

  it('adds a tag only when no tag of its name is kept, whatever the case (BAK-6)', () => {
    const incoming: AccountData = { ...EMPTY, tags: [ERRANDS, GARDEN, createTag('Garden', AT)] }
    const known: KnownRecords = { ...NOTHING_KNOWN, tagNames: ['Errands'] }

    expect(newRecords(incoming, known, AT)).toEqual({ fresh: { ...EMPTY, tags: [GARDEN] }, alreadyHere: 1 })
  })

  it('leaves a tag whose record the account has, even one it cannot read (BAK-6)', () => {
    const known: KnownRecords = { ...NOTHING_KNOWN, tagIds: new Set([ERRANDS.id]) }

    expect(newRecords({ ...EMPTY, tags: [ERRANDS] }, known, AT)).toEqual({ fresh: EMPTY, alreadyHere: 1 })
  })

  it('never writes over a record the account has, however it differs (BAK-6)', () => {
    const incoming: AccountData = {
      ...EMPTY,
      tasks: [renameTask(WRITE, 'Write the report again'), CALL],
      lists: [WORK, HOME],
      redemptions: [COFFEE],
    }
    const known: KnownRecords = {
      ...NOTHING_KNOWN,
      taskIds: new Set([WRITE.id]),
      listIds: new Set([WORK.id]),
      redemptionIds: new Set([COFFEE.id]),
    }

    expect(newRecords(incoming, known, AT)).toEqual({
      fresh: { ...EMPTY, tasks: [CALL], lists: [HOME] },
      alreadyHere: 3,
    })
  })

  it('adds a completion to a day that is there, unless the day already holds it (BAK-6)', () => {
    const incoming: AccountData = {
      ...EMPTY,
      entries: [
        { taskId: WRITE.id, day: '2026-09-19', points: 9 },
        { taskId: CALL.id, day: '2026-09-19', points: 2 },
        { taskId: CALL.id, day: '2026-09-18', points: 2 },
      ],
    }
    const known: KnownRecords = { ...NOTHING_KNOWN, days: new Map([['2026-09-19', new Set([WRITE.id])]]) }

    expect(newRecords(incoming, known, AT)).toEqual({
      fresh: {
        ...EMPTY,
        entries: [
          { taskId: CALL.id, day: '2026-09-19', points: 2 },
          { taskId: CALL.id, day: '2026-09-18', points: 2 },
        ],
      },
      alreadyHere: 1,
    })
  })

  it('adds nothing to a day the app cannot read (BAK-6)', () => {
    const incoming: AccountData = { ...EMPTY, entries: [{ taskId: CALL.id, day: '2026-09-19', points: 2 }] }
    const known: KnownRecords = { ...NOTHING_KNOWN, days: new Map([['2026-09-19', null]]) }

    expect(newRecords(incoming, known, AT)).toEqual({ fresh: EMPTY, alreadyHere: 1 })
  })

  it('takes a record that is in the file twice once', () => {
    const incoming: AccountData = { ...EMPTY, tasks: [WRITE, WRITE] }

    expect(newRecords(incoming, NOTHING_KNOWN, AT).fresh.tasks).toEqual([WRITE])
  })

  it('brings back a task still in the trash, but not one whose time there has run out (BAK-7)', () => {
    const trashed = deleteTask(WRITE, AT)
    const expired = deleteTask(CALL, new Date(AT.getTime() - TRASH_RETENTION_MS))

    expect(newRecords({ ...EMPTY, tasks: [trashed, expired] }, NOTHING_KNOWN, AT).fresh.tasks).toEqual([trashed])
  })

  it('does the same the second time: importing a file twice adds nothing more (BAK-6)', () => {
    const incoming: AccountData = { ...EMPTY, tasks: [WRITE], lists: [WORK] }
    const known: KnownRecords = { ...NOTHING_KNOWN, taskIds: new Set([WRITE.id]), listIds: new Set([WORK.id]) }

    expect(newRecords(incoming, known, AT)).toEqual({ fresh: EMPTY, alreadyHere: 2 })
  })
})

describe('what an import does with the bonuses and the point value', () => {
  it('takes the file\u2019s bonus where the account has none (BAK-14)', () => {
    const incoming: AccountData = { ...EMPTY, bonuses: { today: 10, week: 40, month: null } }

    expect(newRecords(incoming, NOTHING_KNOWN, AT)).toEqual({ fresh: incoming, alreadyHere: 0 })
  })

  it('leaves the account\u2019s own bonus as it is, and counts it as no record (BAK-14)', () => {
    const incoming: AccountData = { ...EMPTY, bonuses: { today: 10, week: 40, month: null } }
    const known: KnownRecords = { ...NOTHING_KNOWN, bonuses: { today: 3, week: null, month: null } }

    expect(newRecords(incoming, known, AT)).toEqual({
      fresh: { ...EMPTY, bonuses: { today: null, week: 40, month: null } },
      alreadyHere: 0,
    })
  })

  it('takes the point value only where the account says nothing (BAK-14)', () => {
    const incoming: AccountData = { ...EMPTY, pointValue: UAH }

    expect(newRecords(incoming, NOTHING_KNOWN, AT)).toEqual({ fresh: incoming, alreadyHere: 0 })
    expect(newRecords(incoming, { ...NOTHING_KNOWN, pointValue: createPointValue(1) }, AT)).toEqual({
      fresh: EMPTY,
      alreadyHere: 0,
    })
  })

  it('adds a prize the account does not have, and leaves one it does (BAK-5, BAK-6)', () => {
    const incoming: AccountData = { ...EMPTY, prizes: [CHOCOLATE] }

    expect(newRecords(incoming, NOTHING_KNOWN, AT)).toEqual({ fresh: incoming, alreadyHere: 0 })
    expect(newRecords(incoming, { ...NOTHING_KNOWN, prizeIds: new Set([CHOCOLATE.id]) }, AT)).toEqual({
      fresh: EMPTY,
      alreadyHere: 1,
    })
  })
})

describe('counting records', () => {
  it('counts each kind, a completion being one entry of the ledger', () => {
    const data: AccountData = {
      tasks: [WRITE, CALL],
      lists: [WORK],
      tags: [ERRANDS],
      prizes: [CHOCOLATE],
      entries: [
        { taskId: WRITE.id, day: '2026-09-19', points: 5 },
        { taskId: WRITE.id, day: '2026-09-18', points: 5 },
      ],
      redemptions: [],
      bonuses: { today: 10, week: null, month: null },
      pointValue: UAH,
    }

    // The bonuses and the point value are settings rather than records, and are counted as none.
    expect(countRecords(data)).toEqual({ tasks: 2, lists: 1, tags: 1, prizes: 1, completions: 2, redemptions: 0 })
  })
})

import { describe, expect, it } from 'vitest'
import {
  activityByDay,
  activityKinds,
  activityNameOf,
  activityPeriodDays,
  activityTotals,
  changeActivityEntry,
  createActivityEntry,
  entriesInSlot,
  entryTimes,
  hasSlotEnded,
  hasSlotStarted,
  InvalidActivityError,
  isActivityName,
  isHourOfDay,
  isSlotLogged,
  knownActivities,
  MAX_ACTIVITY_NAME_LENGTH,
  normalizeActivityName,
  sameActivity,
  sessionActivityEntries,
  shiftActivityPeriod,
  slotAt,
  slotBefore,
  slotKey,
  suggestActivities,
  withoutSession,
  type ActivityEntry,
  type HourSlot,
} from './activity'
import { secondsEntry } from './timeLog'

/* ACT ids refer to wiki/activity-log.md. */

// Friday 2 October 2026, twenty past three in the afternoon.
const NOW = new Date(2026, 9, 2, 15, 20)
const FRI: HourSlot = { day: '2026-10-02', hour: 14 }

function entry(activity: string, minutes: number, slot: HourSlot, at: Date = NOW): ActivityEntry {
  return createActivityEntry(activity, minutes * 60, slot, at)
}

describe('naming an activity (ACT-3)', () => {
  it('squeezes the name and refuses nothing, too long, or two lines', () => {
    expect(normalizeActivityName('  deep   work ')).toBe('deep work')
    expect(isActivityName('   ')).toBe(false)
    expect(isActivityName('a'.repeat(MAX_ACTIVITY_NAME_LENGTH))).toBe(true)
    expect(isActivityName('a'.repeat(MAX_ACTIVITY_NAME_LENGTH + 1))).toBe(false)
    expect(isActivityName('work\nrest')).toBe(false)
    expect(() => normalizeActivityName(' ')).toThrow(InvalidActivityError)
  })

  it('reads two spellings of a name as one activity', () => {
    expect(sameActivity('Reading', ' reading ')).toBe(true)
    expect(sameActivity('Reading', 'Read')).toBe(false)
  })
})

describe('a record (ACT-2, ACT-6)', () => {
  it('holds what, how long and the hour it is under', () => {
    const made = entry(' Reading ', 15, FRI)

    expect(made).toMatchObject({ activity: 'Reading', seconds: 900, day: '2026-10-02', hour: 14, loggedAt: NOW.toISOString() })
    expect(made.id).not.toBe('')
  })

  it('keeps the spelling an activity already has', () => {
    expect(createActivityEntry('reading', 60, FRI, NOW, ['Reading']).activity).toBe('Reading')
  })

  it('refuses no time, or more than a day', () => {
    expect(() => createActivityEntry('Work', 0, FRI, NOW)).toThrow(InvalidActivityError)
    expect(() => createActivityEntry('Work', 24 * 3600 + 1, FRI, NOW)).toThrow(InvalidActivityError)
    expect(createActivityEntry('Sleep', 8 * 3600, FRI, NOW).seconds).toBe(8 * 3600)
  })

  it('changes, handing the record back as it is when nothing changes (ACT-10)', () => {
    const made = entry('Work', 45, FRI)
    const later = new Date(2026, 9, 2, 16, 0)

    expect(changeActivityEntry(made, { activity: 'Work', seconds: 2700, hour: 14 }, later)).toBe(made)

    const changed = changeActivityEntry(made, { activity: 'reading', seconds: 1800, hour: 13 }, later, ['Reading'])
    expect(changed).toMatchObject({ activity: 'Reading', seconds: 1800, hour: 13, loggedAt: later.toISOString() })
    expect(made.activity).toBe('Work')
  })

  it('takes a respelling of its own name as typed', () => {
    const made = entry('work', 45, FRI)

    expect(changeActivityEntry(made, { activity: 'Work', seconds: 2700, hour: 14 }, NOW, ['work']).activity).toBe('Work')
  })
})

describe('time logged on a task (ACT-21)', () => {
  const at = (hour: number, minute: number, second = 0) => new Date(2026, 9, 2, hour, minute, second)
  const session = (seconds: number, loggedAt: Date) => secondsEntry(seconds, loggedAt)
  const times = (made: ActivityEntry) => {
    const range = entryTimes(made)
    return range === null ? null : [range.start.getTime(), range.end.getTime()]
  }

  it('is the time up to the moment it was logged, under the task’s title', () => {
    const logged = session(30 * 60, at(11, 30))
    const [made, ...rest] = sessionActivityEntries('Work', 'task-1', logged, at(11, 30))

    expect(rest).toEqual([])
    expect(made).toMatchObject({
      activity: 'Work',
      seconds: 1800,
      day: '2026-10-02',
      hour: 11,
      startSecond: 0,
      session: { taskId: 'task-1', entryId: logged.id },
      loggedAt: at(11, 30).toISOString(),
    })
    expect(times(made)).toEqual([at(11, 0).getTime(), at(11, 30).getTime()])
  })

  it('is cut at every hour it crosses, each hour given what was spent in it', () => {
    const made = sessionActivityEntries('Work', 'task-1', session(2 * 3600 + 600, at(12, 10, 5)), at(12, 10, 5))

    expect(made.map(({ day, hour, startSecond, seconds }) => ({ day, hour, startSecond, seconds }))).toEqual([
      { day: '2026-10-02', hour: 10, startSecond: 5, seconds: 3595 },
      { day: '2026-10-02', hour: 11, startSecond: 0, seconds: 3600 },
      { day: '2026-10-02', hour: 12, startSecond: 0, seconds: 605 },
    ])
    expect(made.reduce((sum, piece) => sum + piece.seconds, 0)).toBe(2 * 3600 + 600)
    expect(new Set(made.map((piece) => piece.id)).size).toBe(3)
  })

  it('crosses midnight into the day before', () => {
    const made = sessionActivityEntries('Read', 'task-1', session(1800, new Date(2026, 9, 3, 0, 10)))

    expect(made.map(({ day, hour, seconds }) => ({ day, hour, seconds }))).toEqual([
      { day: '2026-10-02', hour: 23, seconds: 1200 },
      { day: '2026-10-03', hour: 0, seconds: 600 },
    ])
  })

  it('takes a timer’s run to the whole second, so its pieces add up to it', () => {
    const made = sessionActivityEntries('Work', 'task-1', session(90, new Date(at(11, 0, 30).getTime() + 400)))

    expect(made.map(({ hour, startSecond, seconds }) => ({ hour, startSecond, seconds }))).toEqual([
      { hour: 10, startSecond: 3600 - 60, seconds: 60 },
      { hour: 11, startSecond: 0, seconds: 30 },
    ])
  })

  it('spells the activity as it is known, and cuts a long title to a name', () => {
    expect(sessionActivityEntries('work', 'task-1', session(60, at(11, 0)), NOW, ['Work'])[0].activity).toBe('Work')

    const long = activityNameOf(`  Write   the ${'very '.repeat(10)}long report `)
    expect(long).toHaveLength(MAX_ACTIVITY_NAME_LENGTH)
    expect(long.startsWith('Write the very very')).toBe(true)
    expect(long.endsWith('…')).toBe(true)
    expect(isActivityName(long)).toBe(true)
    expect(activityNameOf(`${'a'.repeat(38)}😀😀`)).toBe(`${'a'.repeat(38)}…`)
  })

  it('keeps beginning as far into its hour once changed or moved', () => {
    const [made] = sessionActivityEntries('Work', 'task-1', session(600, at(11, 30)))
    const changed = changeActivityEntry(made, { activity: 'Work', seconds: 1800, hour: 14 })

    expect(changed.session).toEqual(made.session)
    expect(times(changed)).toEqual([at(14, 20).getTime(), at(14, 50).getTime()])
    expect(entryTimes(entry('Work', 30, FRI))).toBeNull()
  })

  it('is taken out with its session, leaving every other record', () => {
    const logged = session(2 * 3600, at(12, 0))
    const kept = [entry('Work', 15, FRI), ...sessionActivityEntries('Work', 'task-1', session(600, at(11, 0)))]
    const log = [...kept, ...sessionActivityEntries('Work', 'task-1', logged)]

    expect(log).toHaveLength(4)
    expect(withoutSession(log, logged.id)).toEqual(kept)
  })
})

describe('hours', () => {
  it('names a slot, the one before it, and when it starts and ends', () => {
    expect(slotKey(FRI)).toBe('2026-10-02T14')
    expect(slotKey({ day: '2026-10-02', hour: 9 })).toBe('2026-10-02T09')
    expect(slotAt(NOW)).toEqual({ day: '2026-10-02', hour: 15 })
    expect(slotBefore({ day: '2026-10-01', hour: 0 })).toEqual({ day: '2026-09-30', hour: 23 })
    expect(hasSlotEnded(FRI, NOW)).toBe(true)
    expect(hasSlotEnded(slotAt(NOW), NOW)).toBe(false)
    expect(hasSlotStarted(slotAt(NOW), NOW)).toBe(true)
    expect(hasSlotStarted({ day: '2026-10-02', hour: 16 }, NOW)).toBe(false)
  })

  it('knows an hour of the day from anything else', () => {
    expect(isHourOfDay(0)).toBe(true)
    expect(isHourOfDay(23)).toBe(true)
    expect(isHourOfDay(24)).toBe(false)
    expect(isHourOfDay(1.5)).toBe(false)
    expect(isHourOfDay('3')).toBe(false)
  })

  it('lists what is under a slot in the order it was written down (ACT-7)', () => {
    const first = entry('Work', 45, FRI, new Date(2026, 9, 2, 15, 1))
    const second = entry('Reading', 15, FRI, new Date(2026, 9, 2, 15, 2))
    const elsewhere = entry('Call', 30, { day: '2026-10-02', hour: 13 })

    expect(entriesInSlot([second, elsewhere, first], FRI)).toEqual([first, second])
    expect(isSlotLogged([elsewhere], FRI)).toBe(false)
    expect(isSlotLogged([elsewhere, first], FRI)).toBe(true)
  })
})

describe('the activities offered (ACT-4)', () => {
  const at = (day: number) => new Date(2026, 9, day, 12)

  it('puts the ones used most lately first, spelled as last written', () => {
    const entries = [
      entry('reading', 15, { day: '2026-10-01', hour: 9 }, at(1)),
      entry('Reading', 15, { day: '2026-10-02', hour: 9 }, at(2)),
      entry('Work', 60, { day: '2026-10-02', hour: 10 }, at(2)),
      entry('Work', 60, { day: '2026-10-02', hour: 11 }, at(2)),
      entry('Work', 60, { day: '2026-10-02', hour: 12 }, at(2)),
      // Used a lot, but long ago.
      ...[1, 2, 3, 4].map((hour) => entry('Chess', 60, { day: '2026-07-01', hour }, new Date(2026, 6, 1))),
    ]

    expect(knownActivities(entries, NOW)).toEqual(['Work', 'Reading', 'Chess'])
  })

  it('offers the name typed, then those it starts, then those it is in', () => {
    const known = ['Reading', 'Work', 'Homework', 'Workout', 'Call']

    expect(suggestActivities(known, 'work')).toEqual(['Work', 'Workout', 'Homework'])
    expect(suggestActivities(known, '')).toEqual(known)
    expect(suggestActivities(known, 'x')).toEqual([])
    expect(suggestActivities(known, '', 2)).toEqual(['Reading', 'Work'])
  })
})

describe('adding up (ACT-12 to ACT-16)', () => {
  const work = entry('Work', 45, { day: '2026-09-30', hour: 9 }, new Date(2026, 8, 30, 10))
  const reading = entry('Reading', 15, { day: '2026-09-30', hour: 9 }, new Date(2026, 8, 30, 10, 1))
  const workAgain = entry('work', 60, { day: '2026-10-02', hour: 10 }, new Date(2026, 9, 2, 11))
  const entries = [workAgain, reading, work]

  it('orders the activities by when each was first logged under, whatever their size', () => {
    expect(activityKinds(entries)).toEqual([
      { key: 'work', name: 'work' },
      { key: 'reading', name: 'Reading' },
    ])
  })

  it('adds each up over the days given, both ends included, spellings together', () => {
    const kinds = activityKinds(entries)

    expect(activityTotals(entries, kinds, '2026-09-30', '2026-10-02')).toEqual({
      activities: [
        { kind: kinds[0], seconds: 6300 },
        { kind: kinds[1], seconds: 900 },
      ],
      total: 7200,
    })
    expect(activityTotals(entries, kinds, '2026-10-01', '2026-10-01').total).toBe(0)
  })

  it('divides the days given, days with nothing included', () => {
    const kinds = activityKinds(entries)
    const days = activityByDay(entries, kinds, ['2026-09-30', '2026-10-01', '2026-10-02'])

    expect(days.map((day) => [day.day, day.total])).toEqual([
      ['2026-09-30', 3600],
      ['2026-10-01', 0],
      ['2026-10-02', 3600],
    ])
  })
})

describe('periods (ACT-12)', () => {
  it('reads a day, its week from Monday, or its month', () => {
    expect(activityPeriodDays('day', '2026-10-02')).toEqual(['2026-10-02'])
    expect(activityPeriodDays('week', '2026-10-02')).toEqual([
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
    ])
    const month = activityPeriodDays('month', '2026-02-11')
    expect(month[0]).toBe('2026-02-01')
    expect(month).toHaveLength(28)
  })

  it('steps a day, a week or a month at a time', () => {
    expect(shiftActivityPeriod('day', '2026-10-01', -1)).toBe('2026-09-30')
    expect(shiftActivityPeriod('week', '2026-10-02', -1)).toBe('2026-09-25')
    expect(shiftActivityPeriod('month', '2026-03-31', -1)).toBe('2026-02-01')
    expect(shiftActivityPeriod('month', '2026-12-15', 1)).toBe('2027-01-01')
  })
})

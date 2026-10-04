// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CASE_DAILY_ID,
  CASE_TODAY_ID,
  CASE_WEEK_ID,
  caseQuarter,
  completeTask,
  createTask,
  dailyKeyTime,
  DEFAULT_CASES,
  setDueDate,
  type CaseOpen,
  type CaseSettings,
  type RewardEntry,
  type Task,
} from '../core'
import { CASES_AT_REST, type CaseDeviceRepository, type CaseDeviceState } from '../storage/caseDeviceRepository'
import { CASE_DAILY_NOTICE, CASE_DAILY_NOTICE_BODY } from './caseLabels'
import { useCases } from './useCases'
import type { DailyCaseWatch } from './useCaseKey'

/* Opening Cases. CHST ids refer to wiki/cases.md. */

const WED_16 = new Date(2026, 8, 16, 9, 0)
const THU_17 = new Date(2026, 8, 17, 9, 0)

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function allowNotifications(): ReturnType<typeof vi.fn> {
  vi.spyOn(window, 'focus').mockImplementation(() => {})
  const NotificationMock = vi.fn(function (this: { close: () => void }) {
    this.close = () => {}
  })
  Object.defineProperty(NotificationMock, 'permission', { value: 'granted', configurable: true })
  vi.stubGlobal('Notification', NotificationMock)
  return NotificationMock
}

/** A task due today, done or not. */
function today(title: string, done = false): Task {
  const task = setDueDate(createTask(title, null, WED_16), '2026-09-17')
  return done ? completeTask(task, THU_17) : task
}

function fakeDevice(initial: CaseDeviceState = CASES_AT_REST) {
  let kept = initial
  const saved: CaseDeviceState[] = []
  const device: CaseDeviceRepository = {
    load: () => kept,
    save(state) {
      kept = state
      saved.push(state)
    },
  }
  return { device, saved }
}

function setUp({
  tasks = [today('pack', true)],
  entries = [] as RewardEntry[],
  settings = DEFAULT_CASES as CaseSettings,
  ready = true,
  device = fakeDevice(),
  now = THU_17,
  watch = {} as DailyCaseWatch,
} = {}) {
  const saveEarning = vi.fn()
  const setCaseSettings = vi.fn()
  const ledger = { entries, cases: settings, saveEarning, setCaseSettings }
  const { result } = renderHook(() => useCases(tasks, ledger, device.device, now, ready, watch))
  return { result, saveEarning, setCaseSettings, device }
}

describe('where Cases stands', () => {
  it('has a key waiting once everything in Today is done (CHST-2)', () => {
    expect(setUp().result.current.blocked).toBeNull()
  })

  it('has none while anything is still to do', () => {
    expect(setUp({ tasks: [today('pack', true), today('post')] }).result.current.blocked).toBe('unclear')
  })

  it('has none while the day is smaller than the settings ask for (CHST-3)', () => {
    const { result } = setUp({ tasks: [today('pack', true)], settings: { leastTasks: 3 } })

    expect(result.current.blocked).toBe('bonusWaiting')
    expect(result.current.dayAsked).toBe(1)
  })

  it('says nothing at all until the ledger and the tasks have arrived (CHST-20)', () => {
    const { result } = setUp({ ready: false })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.blocked).toBe('unclear')
    expect(result.current.unannounced).toBe(false)
  })

  it('plays for everything earned today (CHST-7)', () => {
    const entries = [
      { taskId: 'a', day: '2026-09-17', points: 30 },
      { taskId: 'b', day: '2026-09-17', points: 12 },
    ]
    expect(setUp({ entries }).result.current.jackpot).toBe(42)
  })

  it('pays Today from the cheapest task up to half of today (CHST-10)', () => {
    const entries = [
      { taskId: 'a', day: '2026-09-17', points: 30 },
      { taskId: 'b', day: '2026-09-17', points: 12 },
    ]
    expect(setUp({ entries }).result.current.spans.today).toEqual({ least: 12, most: 21 })
    expect(setUp({ entries }).result.current.workings.today).toEqual({
      source: 'today',
      cheapest: 12,
      earned: 42,
      half: 21,
      span: { least: 12, most: 21 },
    })
  })

  it('pays the daily case from yesterday’s rewards divided by yesterday’s tasks (CHST-10)', () => {
    const entries = [
      { taskId: 'a', day: '2026-09-16', points: 10 },
      { taskId: 'b', day: '2026-09-16', points: 8 },
    ]
    expect(setUp({ entries }).result.current.spans.daily).toEqual({ least: 1, most: 9 })
    expect(setUp({ entries }).result.current.workings.daily).toEqual({
      source: 'daily',
      earned: 18,
      tasks: 2,
      share: 9,
      span: { least: 1, most: 9 },
    })
  })

  it('pays Weekly from last week, ready on Monday and planned until then (CHST-30)', () => {
    const monday = new Date(2026, 8, 14, 9, 0)
    const entries = [
      { taskId: 'a', day: '2026-09-07', points: 4 },
      { taskId: 'b', day: '2026-09-10', points: 10 },
    ]
    const { result } = setUp({ tasks: [], entries, now: monday })

    expect(result.current.spans.week).toEqual({ least: 4, most: 7 })
    expect(result.current.workings.week).toEqual({
      source: 'week',
      cheapest: 4,
      earned: 14,
      tasks: 2,
      share: 7,
      span: { least: 4, most: 7 },
    })
    expect(result.current.slots.find((slot) => slot.source === 'week')?.state).toBe('ready')
    expect(setUp({ entries }).result.current.slots.find((slot) => slot.source === 'week')?.state).toBe('waiting')
  })
})

describe('opening it', () => {
  it('opens the daily case under its own name, inside yesterday’s range (CHST-10, CHST-28)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const late = new Date(2026, 8, 17, 23, 0)
    const entries = [
      { taskId: 'a', day: '2026-09-16', points: 10 },
      { taskId: 'b', day: '2026-09-16', points: 4 },
    ]
    const { result, saveEarning } = setUp({ entries, now: late })

    const given = result.current.open('daily')

    // Yesterday earned 14 across 2 tasks, so the range is 1–7. Halfway is 4.
    expect(given).toEqual({ points: 4, jackpot: 7, least: 1 })
    expect(saveEarning).toHaveBeenCalledExactlyOnceWith({
      taskId: CASE_DAILY_ID,
      day: '2026-09-17',
      points: 4,
    })
  })

  it('writes what it gave to the ledger, under the name Cases keeps (CHST-5)', () => {
    const { result, saveEarning } = setUp()

    const given = result.current.open()

    expect(given).not.toBeNull()
    expect(saveEarning).toHaveBeenCalledExactlyOnceWith({
      taskId: CASE_TODAY_ID,
      day: '2026-09-17',
      points: given?.points,
    })
  })

  it('refuses a second press before the write has come back, which would write over the first (CHST-4)', () => {
    const { result, saveEarning } = setUp()

    expect(result.current.open()).not.toBeNull()
    // The ledger has not had a chance to say so yet, as it has not here.
    expect(result.current.open()).toBeNull()
    expect(saveEarning).toHaveBeenCalledTimes(1)
  })

  it('remembers on this device which quarter of the jackpot it came to, so a page opened again still glows (CHST-24)', () => {
    const { result, device } = setUp()

    let given: CaseOpen | null = null
    act(() => {
      given = result.current.open()
    })
    if (given === null) throw new Error('no opening')
    const opened: CaseOpen = given

    expect(device.saved.at(-1)?.lastOpen).toEqual({
      day: '2026-09-17',
      quarter: caseQuarter(opened.points, opened.jackpot),
    })
  })

  it('refuses a second opening the same day, writing nothing (CHST-4)', () => {
    const { result, saveEarning } = setUp({ entries: [{ taskId: CASE_TODAY_ID, day: '2026-09-17', points: 12 }] })

    expect(result.current.blocked).toBe('bonusWaiting')
    expect(result.current.open()).toBeNull()
    expect(saveEarning).not.toHaveBeenCalled()
  })

  it('refuses while the day is unclear, writing nothing', () => {
    const { result, saveEarning } = setUp({ tasks: [today('pack')] })

    expect(result.current.open()).toBeNull()
    expect(saveEarning).not.toHaveBeenCalled()
  })

  it('refuses before the ledger has arrived, so an opening cannot write over the morning’s (CHST-20)', () => {
    const { result, saveEarning } = setUp({ ready: false })

    expect(result.current.open()).toBeNull()
    expect(saveEarning).not.toHaveBeenCalled()
  })

  it('opens Weekly on Monday under its own name, inside last week’s range (CHST-30)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const monday = new Date(2026, 8, 14, 9, 0)
    const entries = [
      { taskId: 'a', day: '2026-09-07', points: 4 },
      { taskId: 'b', day: '2026-09-10', points: 10 },
    ]
    const { result, saveEarning } = setUp({ tasks: [], entries, now: monday })

    const given = result.current.open('week')

    // Last week earned 14 across 2 tasks, cheapest 4, so the range is 4–7. The lowest roll is 4.
    expect(given).toEqual({ points: 4, jackpot: 7, least: 4 })
    expect(saveEarning).toHaveBeenCalledExactlyOnceWith({
      taskId: CASE_WEEK_ID,
      day: '2026-09-14',
      points: 4,
    })
  })

  it('refuses Weekly on any day but Monday, writing nothing', () => {
    const { result, saveEarning } = setUp()

    expect(result.current.open('week')).toBeNull()
    expect(saveEarning).not.toHaveBeenCalled()
  })

  it('says what today’s case gave, however it was opened', () => {
    const { result } = setUp({ entries: [{ taskId: CASE_TODAY_ID, day: '2026-09-17', points: 12 }] })

    expect(result.current.opened).toEqual({ taskId: CASE_TODAY_ID, day: '2026-09-17', points: 12 })
  })

  it('leaves yesterday’s glow behind, the last opening belonging to its day', () => {
    const { result } = setUp({ device: fakeDevice({ ...CASES_AT_REST, lastOpen: { day: '2026-09-16', quarter: 3 } }) })

    expect(result.current.lastQuarter).toBeNull()
  })
})

describe('the notice and the noise', () => {
  it('has a notice to give once a key is waiting, and only until it is given (CHST-23)', () => {
    const { result, device } = setUp()

    expect(result.current.unannounced).toBe(true)

    act(() => {
      result.current.announce()
    })

    expect(device.saved.at(-1)?.noticedDay).toBe('2026-09-17')
    expect(result.current.unannounced).toBe(false)
  })

  it('has none to give where this device already gave today’s', () => {
    const { result } = setUp({ device: fakeDevice({ ...CASES_AT_REST, noticedDay: '2026-09-17' }) })

    expect(result.current.unannounced).toBe(false)
  })

  it('says Weekly is here on Monday, once on this device (CHST-30)', () => {
    const monday = new Date(2026, 8, 14, 9, 0)
    const { result, device } = setUp({ tasks: [], now: monday })

    expect(result.current.shareNotice).toBe(true)
    expect(result.current.unannounced).toBe(false)

    act(() => {
      result.current.announceShare()
    })

    expect(device.saved.at(-1)?.noticedWeek).toBe('2026-09-14')
    expect(result.current.shareNotice).toBe(false)
    expect(result.current.slots.find((slot) => slot.source === 'week')?.state).toBe('ready')
  })

  it('has none to give where this device already said so this Monday', () => {
    const monday = new Date(2026, 8, 14, 9, 0)
    const { result } = setUp({
      tasks: [],
      now: monday,
      device: fakeDevice({ ...CASES_AT_REST, noticedWeek: '2026-09-14' }),
    })

    expect(result.current.shareNotice).toBe(false)
  })

  it('brings Weekly in at Monday while the app is open (CHST-30)', async () => {
    const sunday = new Date(2026, 8, 13, 23, 50)
    vi.useFakeTimers({ now: sunday })
    const { result } = setUp({ tasks: [], now: sunday })

    expect(result.current.slots.find((slot) => slot.source === 'week')?.state).toBe('waiting')
    expect(result.current.shareNotice).toBe(false)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10 * 60 * 1000)
    })

    expect(result.current.slots.find((slot) => slot.source === 'week')?.state).toBe('ready')
    expect(result.current.shareNotice).toBe(true)
  })

  it('does not bring Weekly in while Cases is switched off (CHST-30, FEAT-3)', async () => {
    const sunday = new Date(2026, 8, 13, 23, 50)
    vi.useFakeTimers({ now: sunday })
    const { result } = setUp({ tasks: [], now: sunday, watch: { watching: false } })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10 * 60 * 1000)
    })

    expect(result.current.shareNotice).toBe(false)
    expect(result.current.slots.find((slot) => slot.source === 'week')?.state).toBe('waiting')
  })

  it('does not say the day came clear when only the daily case is ready (CHST-23)', () => {
    const after = new Date(dailyKeyTime('2026-09-17').getTime() + 1000)
    const { result } = setUp({ tasks: [today('pack')], now: after })

    expect(result.current.blocked).toBeNull()
    expect(result.current.unannounced).toBe(false)
  })

  it('says the daily case is here when its timer runs out, on screen and to the browser (CHST-29)', async () => {
    const at = dailyKeyTime('2026-10-04')
    const before = new Date(at.getTime() - 5000)
    vi.useFakeTimers({ now: before })
    const notify = allowNotifications()
    const onOpen = vi.fn()
    const { result } = setUp({ tasks: [], now: before, watch: { onOpen } })

    expect(result.current.dailyNotice).toBe(false)
    expect(result.current.slots.find((slot) => slot.source === 'daily')?.state).toBe('waiting')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })

    expect(result.current.dailyNotice).toBe(true)
    expect(result.current.slots.find((slot) => slot.source === 'daily')?.state).toBe('ready')
    expect(notify).toHaveBeenCalledExactlyOnceWith(CASE_DAILY_NOTICE, {
      body: CASE_DAILY_NOTICE_BODY,
      tag: 'chest-daily',
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })
    expect(notify).toHaveBeenCalledOnce()

    act(() => {
      result.current.dismissDailyNotice()
    })
    expect(result.current.dailyNotice).toBe(false)
  })

  it('opens Cases from the browser notification and puts the notice away (CHST-29)', async () => {
    const at = dailyKeyTime('2026-10-04')
    const before = new Date(at.getTime() - 5000)
    vi.useFakeTimers({ now: before })
    const notify = allowNotifications()
    const onOpen = vi.fn()
    const { result } = setUp({ tasks: [], now: before, watch: { onOpen } })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })

    const notification = notify.mock.instances[0] as { onclick: (() => void) | null }
    act(() => {
      notification.onclick?.()
    })

    expect(onOpen).toHaveBeenCalledOnce()
    expect(result.current.dailyNotice).toBe(false)
  })

  it('does not announce a daily case whose time has already passed (CHST-29)', async () => {
    const at = dailyKeyTime('2026-10-04')
    const after = new Date(at.getTime() + 60_000)
    vi.useFakeTimers({ now: after })
    const notify = allowNotifications()
    const { result } = setUp({ tasks: [], now: after })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000)
    })

    expect(result.current.dailyNotice).toBe(false)
    expect(notify).not.toHaveBeenCalled()
    expect(result.current.slots.find((slot) => slot.source === 'daily')?.state).toBe('ready')
  })

  it('says nothing about the daily case while Cases is switched off (CHST-29, FEAT-3)', async () => {
    const at = dailyKeyTime('2026-10-04')
    const before = new Date(at.getTime() - 5000)
    vi.useFakeTimers({ now: before })
    const notify = allowNotifications()
    const { result } = setUp({ tasks: [], now: before, watch: { watching: false } })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })

    expect(result.current.dailyNotice).toBe(false)
    expect(notify).not.toHaveBeenCalled()
  })

  it('arrives with the sound on, and keeps it turned off on this device (CHST-19)', () => {
    const { result, device } = setUp()

    expect(result.current.sound).toBe(true)

    act(() => {
      result.current.setSound(false)
    })

    expect(result.current.sound).toBe(false)
    expect(device.saved.at(-1)?.sound).toBe(false)
  })

  it('writes a changed setting to the account rather than the device (CHST-7)', () => {
    const { result, setCaseSettings } = setUp()

    result.current.setSettings({ leastTasks: 3 })

    expect(setCaseSettings).toHaveBeenCalledExactlyOnceWith({ leastTasks: 3 })
  })
})

// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CHEST_ID,
  completeTask,
  createTask,
  DEFAULT_CHEST,
  setDueDate,
  type ChestSettings,
  type RewardEntry,
  type Task,
} from '../core'
import { CHEST_AT_REST, type ChestDeviceRepository, type ChestDeviceState } from '../storage/chestDeviceRepository'
import { useChest } from './useChest'

/* Opening the chest. CHST ids refer to wiki/chest.md. */

const WED_16 = new Date(2026, 8, 16, 9, 0)
const THU_17 = new Date(2026, 8, 17, 9, 0)

afterEach(() => {
  cleanup()
})

/** A task due today, done or not. */
function today(title: string, done = false): Task {
  const task = setDueDate(createTask(title, null, WED_16), '2026-09-17')
  return done ? completeTask(task, THU_17) : task
}

function fakeDevice(initial: ChestDeviceState = CHEST_AT_REST) {
  let kept = initial
  const saved: ChestDeviceState[] = []
  const device: ChestDeviceRepository = {
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
  settings = DEFAULT_CHEST as ChestSettings,
  ready = true,
  device = fakeDevice(),
} = {}) {
  const saveEarning = vi.fn()
  const setChestSettings = vi.fn()
  const ledger = { entries, chest: settings, saveEarning, setChestSettings }
  const { result } = renderHook(() => useChest(tasks, ledger, device.device, THU_17, ready))
  return { result, saveEarning, setChestSettings, device }
}

describe('where the chest stands', () => {
  it('has a key waiting once everything in Today is done (CHST-2)', () => {
    expect(setUp().result.current.blocked).toBeNull()
  })

  it('has none while anything is still to do', () => {
    expect(setUp({ tasks: [today('pack', true), today('post')] }).result.current.blocked).toBe('unclear')
  })

  it('has none while the day is smaller than the settings ask for (CHST-3)', () => {
    const { result } = setUp({ tasks: [today('pack', true)], settings: { leastTasks: 3, jackpot: 'bestTask' } })

    expect(result.current.blocked).toBe('tooSmall')
    expect(result.current.dayAsked).toBe(1)
  })

  it('says nothing at all until the ledger and the tasks have arrived (CHST-20)', () => {
    const { result } = setUp({ ready: false })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.blocked).toBe('unclear')
    expect(result.current.unannounced).toBe(false)
  })

  it('plays for the heaviest task of today (CHST-7)', () => {
    expect(setUp({ entries: [{ taskId: 'a', day: '2026-09-17', points: 30 }] }).result.current.jackpot).toBe(30)
  })
})

describe('opening it', () => {
  it('writes what it gave to the ledger, under the chest’s own name (CHST-5)', () => {
    const { result, saveEarning } = setUp()

    const given = result.current.open()

    expect(given).not.toBeNull()
    expect(saveEarning).toHaveBeenCalledExactlyOnceWith({
      taskId: CHEST_ID,
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

  it('remembers on this device which tier it was, so a page opened again still glows (CHST-24)', () => {
    const { result, device } = setUp()

    const given = act(() => result.current.open())
    void given

    expect(device.saved.at(-1)?.lastOpen).toEqual({ day: '2026-09-17', tier: expect.any(String) })
  })

  it('refuses a second opening the same day, writing nothing (CHST-4)', () => {
    const { result, saveEarning } = setUp({ entries: [{ taskId: CHEST_ID, day: '2026-09-17', points: 12 }] })

    expect(result.current.blocked).toBe('opened')
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

  it('says what today’s chest gave, however it was opened', () => {
    const { result } = setUp({ entries: [{ taskId: CHEST_ID, day: '2026-09-17', points: 12 }] })

    expect(result.current.opened).toEqual({ taskId: CHEST_ID, day: '2026-09-17', points: 12 })
  })

  it('leaves yesterday’s glow behind, the last opening belonging to its day', () => {
    const { result } = setUp({ device: fakeDevice({ ...CHEST_AT_REST, lastOpen: { day: '2026-09-16', tier: 'haul' } }) })

    expect(result.current.lastTier).toBeNull()
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
    const { result } = setUp({ device: fakeDevice({ ...CHEST_AT_REST, noticedDay: '2026-09-17' }) })

    expect(result.current.unannounced).toBe(false)
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
    const { result, setChestSettings } = setUp()

    result.current.setSettings({ leastTasks: 3, jackpot: 'typicalDay' })

    expect(setChestSettings).toHaveBeenCalledExactlyOnceWith({ leastTasks: 3, jackpot: 'typicalDay' })
  })
})

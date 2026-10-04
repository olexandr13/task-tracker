import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_CHECK_IN_WINDOW, DEFAULT_NUDGE_WINDOW, type NudgeWindow, type QuietHours, type WarmUpProgress } from '../core'
import { modeStates } from './modes'
import { WARM_UP_DISABLE_WARNING } from './warmUpLabels'

/* The modes as the Modes pages read them. MODE ids refer to wiki/modes.md;
   JUST ids to wiki/just-one.md, WARM ids to wiki/warm-up.md, CHECKIN ids to wiki/check-ins.md. */

const WARMING_UP: WarmUpProgress = { day: 3, daysLeft: 27, allowed: 3, used: 2, remaining: 1, paused: false }

function sources(over: {
  phase?: 'off' | 'idle' | 'focus' | 'won'
  available?: boolean
  progress?: WarmUpProgress | null
  loading?: boolean
  nudgeOn?: boolean
  quietHours?: QuietHours
  window?: NudgeWindow | null
  checkInOn?: boolean
} = {}) {
  const loading = over.loading ?? false
  return {
    procrastination: {
      phase: over.phase ?? ('off' as const),
      available: over.available ?? true,
      loading,
      onStart: vi.fn(),
      onEnd: vi.fn(),
    },
    warmUp: { progress: over.progress ?? null, loading, onStart: vi.fn(), onEnd: vi.fn() },
    nudge: {
      on: over.nudgeOn ?? false,
      quietHours: over.quietHours ?? 2,
      window: over.window ?? null,
      loading,
      onTurnOn: vi.fn(),
    },
    checkIn: { on: over.checkInOn ?? false, window: DEFAULT_CHECK_IN_WINDOW, loading, onTurnOn: vi.fn() },
  }
}

describe('modeStates', () => {
  it('reads every mode as disabled while none is on, with nothing more to say (MODE-3)', () => {
    const modes = modeStates(sources())

    for (const mode of ['modes/procrastination', 'modes/warm-up', 'modes/nudge', 'modes/check-in'] as const) {
      expect(modes[mode].on).toBe(false)
      expect(modes[mode].status).toEqual({ state: 'Disabled', detail: null })
    }
  })

  it('says which part of Procrastination mode is on, beside the mode (MODE-3, JUST-5)', () => {
    expect(modeStates(sources({ phase: 'focus' }))['modes/procrastination'].status)
      .toEqual({ state: 'Enabled', detail: 'One task in front of you' })
    expect(modeStates(sources({ phase: 'idle' }))['modes/procrastination'].status)
      .toEqual({ state: 'Enabled', detail: 'Resting' })
    expect(modeStates(sources({ phase: 'won' }))['modes/procrastination'].status)
      .toEqual({ state: 'Enabled', detail: 'A win to enjoy' })
  })

  it('says how far through its month a warm-up is (MODE-3, WARM-3)', () => {
    const warmUp = modeStates(sources({ progress: WARMING_UP }))['modes/warm-up']

    expect(warmUp.on).toBe(true)
    expect(warmUp.status).toEqual({ state: 'Enabled', detail: 'Day 3 of 30 · 27 days left' })
  })

  it('says a paused warm-up is still on, held on the day it froze (MODE-3, WARM-11)', () => {
    const warmUp = modeStates(sources({ progress: { ...WARMING_UP, paused: true } }))['modes/warm-up']

    expect(warmUp.on).toBe(true)
    expect(warmUp.status).toEqual({ state: 'Enabled', detail: 'Paused · Day 3 of 30 · 27 days left' })
  })

  it('blocks Procrastination mode while Today has nothing to do (MODE-6, JUST-2)', () => {
    const modes = modeStates(sources({ available: false }))

    expect(modes['modes/procrastination'].blocked).toBe('Nothing to do in Today.')
    expect(modes['modes/procrastination'].status).toEqual({ state: 'Disabled', detail: 'Nothing to do in Today' })
    // The warm-up is about the habits, and asks nothing of Today.
    expect(modes['modes/warm-up'].blocked).toBeNull()
  })

  it('says what the nudge is waiting for, and the hours it keeps to (MODE-3, NUDGE-12)', () => {
    const anyHour = modeStates(sources({ nudgeOn: true, quietHours: 3 }))['modes/nudge']
    expect(anyHour.on).toBe(true)
    expect(anyHour.status).toEqual({ state: 'Enabled', detail: 'After 3h with nothing done' })

    const daytime = modeStates(sources({ nudgeOn: true, quietHours: 2, window: DEFAULT_NUDGE_WINDOW }))
    expect(daytime['modes/nudge'].status).toEqual({
      state: 'Enabled',
      detail: 'After 2h with nothing done · 09:00–22:00',
    })
  })

  it('never blocks the nudge once its setting is here, whatever the browser allows (MODE-6, NUDGE-10)', () => {
    expect(modeStates(sources())['modes/nudge'].blocked).toBeNull()
  })

  it('says the hours the check-in asks about, and never blocks it once loaded (MODE-3, CHECKIN-2)', () => {
    const checkIn = modeStates(sources({ checkInOn: true }))['modes/check-in']

    expect(checkIn.on).toBe(true)
    expect(checkIn.status).toEqual({ state: 'Enabled', detail: 'Every hour · 09:00–22:00' })
    expect(checkIn.blocked).toBeNull()
  })

  it('says a mode is still loading rather than disabled, and will not switch it (MODE-8)', () => {
    // A warm-up not read yet reads as no warm-up; turning it on here would start
    // a fresh month over the one already running. A nudge setting not read yet
    // reads as off, which the switch would then send back to the account.
    const modes = modeStates(sources({ loading: true, progress: null }))

    for (const mode of ['modes/procrastination', 'modes/warm-up', 'modes/nudge', 'modes/check-in'] as const) {
      expect(modes[mode].status).toEqual({ state: 'Loading…', detail: null })
      expect(modes[mode].blocked).toBe('Still loading.')
    }
  })

  it('turns a mode on and off through the one switch (MODE-3)', () => {
    const given = sources({ progress: WARMING_UP })
    const modes = modeStates(given)

    modes['modes/procrastination'].toggle(true)
    expect(given.procrastination.onStart).toHaveBeenCalledOnce()

    modes['modes/warm-up'].toggle(false)
    expect(given.warmUp.onEnd).toHaveBeenCalledOnce()
    expect(given.warmUp.onStart).not.toHaveBeenCalled()
    // Ending it is asked for first, on the switch: enabling it again starts over (WARM-9).
    expect(modes['modes/warm-up'].confirmOff).toBe(WARM_UP_DISABLE_WARNING)
    expect(modes['modes/procrastination'].confirmOff).toBeUndefined()
    expect(modes['modes/nudge'].confirmOff).toBeUndefined()
    expect(modes['modes/check-in'].confirmOff).toBeUndefined()

    modes['modes/nudge'].toggle(true)
    expect(given.nudge.onTurnOn).toHaveBeenCalledExactlyOnceWith(true)

    modes['modes/check-in'].toggle(true)
    expect(given.checkIn.onTurnOn).toHaveBeenCalledExactlyOnceWith(true)
  })
})

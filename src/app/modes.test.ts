import { describe, expect, it, vi } from 'vitest'
import type { WarmUpProgress } from '../core'
import { modeStates } from './modes'

/* The modes as the Modes pages read them. MODE ids refer to wiki/modes.md;
   JUST ids to wiki/just-one.md, WARM ids to wiki/warm-up.md. */

const WARMING_UP: WarmUpProgress = { day: 3, daysLeft: 27, allowed: 3, used: 2, remaining: 1 }

function sources(over: {
  phase?: 'off' | 'idle' | 'focus' | 'won'
  available?: boolean
  progress?: WarmUpProgress | null
  loading?: boolean
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
  }
}

describe('modeStates', () => {
  it('reads both modes as disabled while neither is on, with nothing more to say (MODE-3)', () => {
    const modes = modeStates(sources())

    expect(modes['modes/procrastination'].on).toBe(false)
    expect(modes['modes/procrastination'].status).toEqual({ state: 'Disabled', detail: null })
    expect(modes['modes/warm-up'].on).toBe(false)
    expect(modes['modes/warm-up'].status).toEqual({ state: 'Disabled', detail: null })
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

  it('blocks Procrastination mode while Today has nothing to do (MODE-6, JUST-2)', () => {
    const modes = modeStates(sources({ available: false }))

    expect(modes['modes/procrastination'].blocked).toBe('Nothing to do in Today.')
    expect(modes['modes/procrastination'].status).toEqual({ state: 'Disabled', detail: 'Nothing to do in Today' })
    // The warm-up is about the habits, and asks nothing of Today.
    expect(modes['modes/warm-up'].blocked).toBeNull()
  })

  it('says a mode is still loading rather than disabled, and will not switch it (MODE-8)', () => {
    // A warm-up not read yet reads as no warm-up; turning it on here would start
    // a fresh month over the one already running.
    const modes = modeStates(sources({ loading: true, progress: null }))

    for (const mode of ['modes/procrastination', 'modes/warm-up'] as const) {
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
  })
})

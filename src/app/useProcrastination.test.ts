// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  PROCRASTINATION_OFF,
  type ProcrastinationRepository,
  type ProcrastinationState,
} from '../storage/procrastinationRepository'
import { useProcrastination } from './useProcrastination'

const WED = new Date(2026, 8, 16, 9, 0)
const THU = new Date(2026, 8, 17, 9, 0)

function memory(initial: ProcrastinationState = PROCRASTINATION_OFF): ProcrastinationRepository {
  let saved = initial
  return {
    load: () => saved,
    save: (next) => {
      saved = next
    },
  }
}

describe('useProcrastination (JUST-10)', () => {
  it('restores focus saved for today', () => {
    const repo = memory({ phase: 'focus', taskId: 'a', day: '2026-09-16' })
    const { result } = renderHook(() => useProcrastination(repo, WED))
    expect(result.current[0]).toEqual({ phase: 'focus', taskId: 'a', day: '2026-09-16' })
  })

  it('clears a mode saved for a previous day', () => {
    const save = vi.fn()
    const repo: ProcrastinationRepository = {
      load: () => ({ phase: 'focus', taskId: 'a', day: '2026-09-16' }),
      save,
    }
    const { result } = renderHook(() => useProcrastination(repo, THU))
    expect(result.current[0]).toEqual(PROCRASTINATION_OFF)
    expect(save).toHaveBeenCalledWith(PROCRASTINATION_OFF)
  })

  it('persists a new focus for today', () => {
    const repo = memory()
    const { result } = renderHook(() => useProcrastination(repo, WED))
    act(() => {
      result.current[1]({ phase: 'focus', taskId: 'b' })
    })
    expect(result.current[0]).toEqual({ phase: 'focus', taskId: 'b', day: '2026-09-16' })
    expect(repo.load()).toEqual({ phase: 'focus', taskId: 'b', day: '2026-09-16' })
  })
})

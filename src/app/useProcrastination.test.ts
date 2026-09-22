// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  addSubtask,
  completeTask,
  createTask,
  PROCRASTINATION_OFF,
  type ProcrastinationState,
  type RewardEntry,
  type Task,
} from '../core'
import type { ProcrastinationRepository } from '../storage/procrastinationRepository'
import { useProcrastination, type WinLedger } from './useProcrastination'

/* Procrastination mode as the screen drives it. JUST ids refer to wiki/just-one.md. */

const WED = new Date(2026, 8, 16, 9, 0)
const THU = new Date(2026, 8, 17, 9, 0)

function memory(initial: ProcrastinationState = PROCRASTINATION_OFF) {
  let saved = initial
  const repository: ProcrastinationRepository = {
    load: () => saved,
    save: vi.fn((next: ProcrastinationState) => {
      saved = next
    }),
  }
  return repository
}

function ledger(entries: RewardEntry[] = []): WinLedger {
  return { entries, saveEarning: vi.fn() }
}

/** The easy one — no checklist — and a harder one with three items still open (JUST-4). */
const EASY = createTask('stretch', null, WED)
const HARD = ['a', 'b', 'c'].reduce((task, item) => addSubtask(task, item, WED), createTask('report', null, WED))

function render(repository: ProcrastinationRepository, today: Task[] | null, now = WED, points = ledger()) {
  return renderHook(({ tasks }: { tasks: Task[] | null }) => useProcrastination(repository, tasks, now, points), {
    initialProps: { tasks: today },
  })
}

describe('useProcrastination', () => {
  it('restores focus saved for today (JUST-10)', () => {
    const { result } = render(memory({ phase: 'focus', taskId: EASY.id, day: '2026-09-16' }), null)

    expect(result.current.phase).toBe('focus')
    expect(result.current.taskId).toBe(EASY.id)
  })

  it('clears a mode saved for a previous day, and writes that down once drawn (JUST-10)', () => {
    const repository = memory({ phase: 'focus', taskId: EASY.id, day: '2026-09-16' })
    const { result } = render(repository, null, THU)

    expect(result.current.phase).toBe('off')
    expect(repository.save).toHaveBeenCalledWith(PROCRASTINATION_OFF)
  })

  it('starts on the easiest open Today task, and keeps it for the day (JUST-3, JUST-4)', () => {
    const repository = memory()
    const { result } = render(repository, [HARD, EASY])

    act(() => { result.current.start() })

    expect(result.current.taskId).toBe(EASY.id)
    expect(repository.load()).toEqual({ phase: 'focus', taskId: EASY.id, day: '2026-09-16' })
  })

  it('switches to another open task, or rests when there is none (JUST-6)', () => {
    const { result } = render(memory({ phase: 'focus', taskId: EASY.id, day: '2026-09-16' }), [EASY, HARD])

    act(() => { result.current.pickNext() })
    expect(result.current.taskId).toBe(HARD.id)

    const alone = render(memory({ phase: 'focus', taskId: EASY.id, day: '2026-09-16' }), [EASY, completeTask(HARD, WED)])
    expect(alone.result.current.hasOtherTask).toBe(false)
  })

  it('turns a focused task finished anywhere into a win, with what it earned (JUST-7, JUST-9)', () => {
    const points = ledger([{ taskId: EASY.id, day: '2026-09-16', points: 2 }])
    const repository = memory({ phase: 'focus', taskId: EASY.id, day: '2026-09-16' })
    const { result, rerender } = render(repository, [EASY], WED, points)

    rerender({ tasks: [completeTask(EASY, WED)] })

    expect(result.current.phase).toBe('won')
    expect(result.current.wonTask?.id).toBe(EASY.id)
    expect(result.current.pointsEarned).toBe(2)
    expect(repository.load()).toEqual({ phase: 'won', taskId: EASY.id, day: '2026-09-16' })

    act(() => { result.current.grantPoints(3) })
    expect(points.saveEarning).toHaveBeenCalledWith({ taskId: EASY.id, day: '2026-09-16', points: 3 })
  })

  it('is on offer while a Today task is open, or while the mode is on (JUST-1, JUST-2)', () => {
    expect(render(memory(), [EASY]).result.current.available).toBe(true)
    expect(render(memory(), [completeTask(EASY, WED)]).result.current.available).toBe(false)
    expect(render(memory({ phase: 'idle', day: '2026-09-16' }), []).result.current.available).toBe(true)
  })

  it('rests and ends as asked (JUST-7, JUST-8)', () => {
    const { result } = render(memory({ phase: 'focus', taskId: EASY.id, day: '2026-09-16' }), [EASY])

    act(() => { result.current.rest() })
    expect(result.current.phase).toBe('idle')

    act(() => { result.current.end() })
    expect(result.current.phase).toBe('off')
  })
})

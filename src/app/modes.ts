import type { WarmUpProgress } from '../core'
import type { ProcrastinationPhase } from './components/ProcrastinationMode'
import {
  describeProcrastinationStatus,
  describeWarmUpStatus,
  MODE_LOADING,
  MODE_NOT_LOADED,
  NOTHING_TO_FOCUS_ON,
} from './modeLabels'
import type { ModeView } from './view'

/**
 * A mode as the Modes page and each mode's own page need it: whether it is on,
 * where it stands in a few words, whether it can be turned on at all, and the
 * one way to turn it either way.
 *
 * Every mode is shaped the same here, so the page that lists them holds no
 * knowledge of any particular one and a third mode is one entry more (MODE-2).
 * What each mode actually does with being on stays where it always was —
 * `useProcrastination`, `useWarmUp`.
 */
export interface ModeState {
  readonly view: ModeView
  /** Whether it is on now. */
  readonly on: boolean
  /** Where it stands: `Off`, `On · Day 3 of 30 · 27 days left`. */
  readonly status: string
  /** Why it cannot be turned on just now, or null while it can (MODE-6, MODE-8). */
  readonly blocked: string | null
  /** Turns it on or off at once — no confirm, as everywhere else. */
  readonly toggle: (on: boolean) => void
}

interface ModeSources {
  procrastination: {
    phase: ProcrastinationPhase
    /** Whether there is anything to focus on (JUST-2). */
    available: boolean
    /** Whether what the mode is measured against is still on its way (MODE-8). */
    loading: boolean
    onStart: () => void
    onEnd: () => void
  }
  warmUp: {
    /** Where the warm-up stands, or null while none is under way. */
    progress: WarmUpProgress | null
    /** Whether the warm-up, or the habits it counts, are still on their way (MODE-8). */
    loading: boolean
    onStart: () => void
    onEnd: () => void
  }
}

/** Every mode, as the Modes pages read it, from what the hooks hold. */
export function modeStates({ procrastination, warmUp }: ModeSources): Record<ModeView, ModeState> {
  return {
    'modes/procrastination': {
      view: 'modes/procrastination',
      on: procrastination.phase !== 'off',
      status: procrastination.loading
        ? MODE_LOADING
        : describeProcrastinationStatus(procrastination.phase, procrastination.available),
      // Being on is itself being available, so a mode that is on is never blocked from ending.
      blocked: procrastination.loading
        ? MODE_NOT_LOADED
        : procrastination.available
          ? null
          : `There is ${NOTHING_TO_FOCUS_ON}.`,
      toggle: (on) => { if (on) procrastination.onStart(); else procrastination.onEnd() },
    },
    'modes/warm-up': {
      view: 'modes/warm-up',
      on: warmUp.progress !== null,
      status: warmUp.loading ? MODE_LOADING : describeWarmUpStatus(warmUp.progress),
      // A warm-up not read yet reads as none, and turning it on would start a
      // fresh month over the one already running (WARM-2).
      blocked: warmUp.loading ? MODE_NOT_LOADED : null,
      toggle: (on) => { if (on) warmUp.onStart(); else warmUp.onEnd() },
    },
  }
}

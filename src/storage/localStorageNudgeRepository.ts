import { createLocalStorageSetting } from './localStorageSetting'
import { NUDGE_RESTING, type NudgeRepository } from './nudgeRepository'
import { readNudge, toStoredNudge } from './nudgeSchema'

/**
 * The nudge's setting in this browser's `localStorage`, so it survives a
 * refresh — and so does the moment the last nudge was shown, which is what
 * keeps a reload from nudging all over again. Anything unreadable reads as off.
 */
export const localStorageNudgeRepository: NudgeRepository = createLocalStorageSetting({
  key: 'task-tracker/nudge',
  read: readNudge,
  write: toStoredNudge,
  fallback: NUDGE_RESTING,
})

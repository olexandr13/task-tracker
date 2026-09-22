import type { ProcrastinationState } from '../core'

/**
 * Where today's Procrastination mode is kept between visits on this device.
 * Not the account: it is a way of looking at Today here, not data to sync.
 */
export interface ProcrastinationRepository {
  load(): ProcrastinationState
  save(state: ProcrastinationState): void
}

import type { Prize, PrizeId } from '../core'
import type { RecordChanges } from './recordChanges'

/** What one change to the wishlist comes to, prize by prize (./recordChanges). */
export type PrizeChanges = RecordChanges<Prize, PrizeId>

/**
 * Where an account's wishlist lives. Every call site talks to this interface
 * rather than to the service behind it, as with the tasks (./taskRepository).
 *
 * Changes are written prize by prize, never as the whole list, so a device only
 * ever writes the prizes it changed and cannot undo what another device did to
 * the rest meanwhile.
 */
export interface PrizeRepository {
  /**
   * Calls back with every saved prize once they are known, and again whenever
   * they change — here, in another tab or on another device. Returns the way to stop.
   */
  subscribe(onPrizes: (prizes: Prize[]) => void, onError: (error: unknown) => void): () => void
  save(changes: PrizeChanges): Promise<void>
}

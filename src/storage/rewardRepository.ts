import type { Redemption, RedemptionId, RewardChanges, RewardEntry } from '../core'

/** Everything the points are read from: what completions earned, what was redeemed, and what clearing Today is worth. */
export interface PointsLedger {
  readonly entries: readonly RewardEntry[]
  readonly redemptions: readonly Redemption[]
  /** What clearing Today earns (RWD-24), or null when it earns nothing. */
  readonly todayBonus: number | null
}

/**
 * Where an account's points live, kept apart from its tasks so that earned stays
 * earned whatever becomes of the task. Every call site talks to this interface
 * rather than to the service behind it, as with the tasks (./taskRepository).
 */
export interface RewardRepository {
  /**
   * Calls back with the whole ledger once all of it is known, and again whenever
   * any of it changes — here, in another tab or on another device. Returns the way to stop.
   */
  subscribe(onLedger: (ledger: PointsLedger) => void, onError: (error: unknown) => void): () => void
  /** Records what a change to the tasks earned and took back. */
  save(changes: RewardChanges): Promise<void>
  redeem(redemption: Redemption): Promise<void>
  /** Deletes a redemption, which gives its points back. */
  removeRedemption(id: RedemptionId): Promise<void>
  /** Sets what clearing Today earns from here on, or takes the bonus away with null. */
  setTodayBonus(points: number | null): Promise<void>
  /** Takes on a bonus from elsewhere — the guest's — only where there is none already, as `importTasks` does. */
  importTodayBonus(points: number): Promise<void>
}

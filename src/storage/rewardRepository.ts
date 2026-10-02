import type {
  ChestSettings,
  Period,
  PeriodBonuses,
  PointValue,
  Redemption,
  RedemptionId,
  RewardChanges,
  RewardEntry,
} from '../core'

/**
 * Everything the points are read from: what completions earned, what was
 * redeemed, what clearing each period earns, what a point is worth, and what the
 * chest asks of a day.
 */
export interface PointsLedger {
  readonly entries: readonly RewardEntry[]
  readonly redemptions: readonly Redemption[]
  /** What clearing each period earns (RWD-24, RWD-29), null where it earns nothing. */
  readonly bonuses: PeriodBonuses
  /** What one point is worth in money (RWD-31), or null while nothing says. */
  readonly pointValue: PointValue | null
  /** What the chest asks of a day and what its key plays for (CHST-2, CHST-7). */
  readonly chest: ChestSettings
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
  /** Sets what clearing the period earns from here on, or takes its bonus away with null. */
  setBonus(period: Period, points: number | null): Promise<void>
  /** Sets what one point is worth, or forgets it with null. */
  setPointValue(value: PointValue | null): Promise<void>
  /** Sets what the chest asks of a day and what its key plays for. */
  setChestSettings(settings: ChestSettings): Promise<void>
  /** Takes on a bonus from elsewhere — the guest's — only where there is none already, as `importTasks` does. */
  importBonus(period: Period, points: number): Promise<void>
  /** Takes on a point value from elsewhere, only where there is none already. */
  importPointValue(value: PointValue): Promise<void>
  /** Takes on chest settings from elsewhere, only where there are none already. */
  importChestSettings(settings: ChestSettings): Promise<void>
}

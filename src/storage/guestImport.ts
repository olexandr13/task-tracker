import { BONUS_PERIODS } from '../core'
import type { ListRepository } from './listRepository'
import { clearGuestAccount } from './localBackupRepository'
import { loadGuestLists } from './localListRepository'
import { loadGuestPrizes } from './localPrizeRepository'
import { loadGuestLedger } from './localRewardRepository'
import { loadGuestTags } from './localTagRepository'
import { loadGuestTasks } from './localTaskRepository'
import { loadGuestWarmUp } from './localWarmUpRepository'
import type { PrizeRepository } from './prizeRepository'
import type { RewardRepository } from './rewardRepository'
import type { TagRepository } from './tagRepository'
import type { TaskRepository } from './taskRepository'
import type { WarmUpRepository } from './warmUpRepository'

/**
 * Moves the guest's records into a signed-in account, then forgets them here.
 * Only once the account has them: a move that fails, offline say, leaves them
 * for the next attempt — same rule as the older local-task move (STORE-19).
 */
export async function importGuestAccount(
  tasks: TaskRepository,
  lists: ListRepository,
  tags: TagRepository,
  prizes: PrizeRepository,
  rewards: RewardRepository,
  warmUp: WarmUpRepository,
): Promise<void> {
  const guestTasks = loadGuestTasks()
  const guestLists = loadGuestLists()
  const guestTags = loadGuestTags()
  const guestPrizes = loadGuestPrizes()
  const ledger = loadGuestLedger()
  const guestWarmUp = loadGuestWarmUp()

  const empty =
    guestTasks.length === 0 &&
    guestLists.length === 0 &&
    guestTags.length === 0 &&
    guestPrizes.length === 0 &&
    ledger.entries.length === 0 &&
    ledger.redemptions.length === 0 &&
    BONUS_PERIODS.every((period) => ledger.bonuses[period] === null) &&
    ledger.pointValue === null &&
    guestWarmUp === null

  if (empty) {
    clearGuestAccount()
    return
  }

  // Asking the account what it already has needs the server. Offline that wait
  // is a hang; leave the guest's data for the next open with a connection.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return

  if (guestTasks.length > 0) await tasks.importTasks(guestTasks)
  if (guestLists.length > 0) await lists.save({ saved: guestLists, removed: [] })
  if (guestTags.length > 0) await tags.save({ saved: guestTags, removed: [] })
  if (guestPrizes.length > 0) await prizes.save({ saved: guestPrizes, removed: [] })

  if (ledger.entries.length > 0) {
    await rewards.save({ earned: [...ledger.entries], revoked: [] })
  }
  for (const redemption of ledger.redemptions) {
    await rewards.redeem(redemption)
  }

  // What was set as guest comes too, where the account has none of its own.
  for (const period of BONUS_PERIODS) {
    const points = ledger.bonuses[period]
    if (points !== null) await rewards.importBonus(period, points)
  }
  if (ledger.pointValue !== null) await rewards.importPointValue(ledger.pointValue)
  // A warm-up begun as guest keeps the day it began on, so signing in does not
  // start the month again (WARM-10).
  if (guestWarmUp !== null) await warmUp.importWarmUp(guestWarmUp)

  clearGuestAccount()
}

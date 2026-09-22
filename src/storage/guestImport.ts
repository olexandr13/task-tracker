import type { ListRepository } from './listRepository'
import { clearGuestAccount } from './localBackupRepository'
import { loadGuestLists } from './localListRepository'
import { loadGuestLedger } from './localRewardRepository'
import { loadGuestTags } from './localTagRepository'
import { loadGuestTasks } from './localTaskRepository'
import type { RewardRepository } from './rewardRepository'
import type { TagRepository } from './tagRepository'
import type { TaskRepository } from './taskRepository'

/**
 * Moves the guest's records into a signed-in account, then forgets them here.
 * Only once the account has them: a move that fails, offline say, leaves them
 * for the next attempt — same rule as the older local-task move (STORE-19).
 */
export async function importGuestAccount(
  tasks: TaskRepository,
  lists: ListRepository,
  tags: TagRepository,
  rewards: RewardRepository,
): Promise<void> {
  const guestTasks = loadGuestTasks()
  const guestLists = loadGuestLists()
  const guestTags = loadGuestTags()
  const ledger = loadGuestLedger()

  const empty =
    guestTasks.length === 0 &&
    guestLists.length === 0 &&
    guestTags.length === 0 &&
    ledger.entries.length === 0 &&
    ledger.redemptions.length === 0 &&
    ledger.todayBonus === null

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

  if (ledger.entries.length > 0) {
    await rewards.save({ earned: [...ledger.entries], revoked: [] })
  }
  for (const redemption of ledger.redemptions) {
    await rewards.redeem(redemption)
  }

  // The bonus set as guest comes too, where the account has none of its own.
  if (ledger.todayBonus !== null) await rewards.importTodayBonus(ledger.todayBonus)

  clearGuestAccount()
}

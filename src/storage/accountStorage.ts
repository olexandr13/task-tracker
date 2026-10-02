import type { Account } from './authService'
import type { BackupRepository } from './backupRepository'
import type { CategoryRepository } from './categoryRepository'
import { firestore } from './firebaseApp'
import { createFirestoreBackupRepository } from './firestoreBackupRepository'
import { createFirestoreCategoryRepository } from './firestoreCategoryRepository'
import { createFirestoreListRepository } from './firestoreListRepository'
import { createFirestoreNudgeRepository } from './firestoreNudgeRepository'
import { createFirestorePrizeRepository } from './firestorePrizeRepository'
import { createFirestoreProcrastinationRepository } from './firestoreProcrastinationRepository'
import { createFirestoreRewardRepository } from './firestoreRewardRepository'
import { createFirestoreSyncMonitor } from './firestoreSyncMonitor'
import { createFirestoreTagRepository } from './firestoreTagRepository'
import { createFirestoreTaskRepository } from './firestoreTaskRepository'
import { createFirestoreWarmUpRepository } from './firestoreWarmUpRepository'
import { importGuestAccount } from './guestImport'
import type { ListRepository } from './listRepository'
import { createLocalBackupRepository } from './localBackupRepository'
import { createLocalCategoryRepository } from './localCategoryRepository'
import { createLocalListRepository } from './localListRepository'
import { createLocalNudgeRepository } from './localNudgeRepository'
import { createLocalPrizeRepository } from './localPrizeRepository'
import { createLocalProcrastinationRepository } from './localProcrastinationRepository'
import { createLocalRewardRepository } from './localRewardRepository'
import { createLocalSyncMonitor } from './localSyncMonitor'
import { createLocalTagRepository } from './localTagRepository'
import { importLocalTasks } from './localTaskImport'
import { createLocalTaskRepository } from './localTaskRepository'
import { forgetLegacyNudge, loadLegacyNudge } from './localStorageNudgeRepository'
import { createLocalWarmUpRepository } from './localWarmUpRepository'
import type { NudgeRepository } from './nudgeRepository'
import type { PrizeRepository } from './prizeRepository'
import type { ProcrastinationRepository } from './procrastinationRepository'
import type { RewardRepository } from './rewardRepository'
import type { SyncMonitor } from './syncMonitor'
import type { TagRepository } from './tagRepository'
import type { TaskRepository } from './taskRepository'
import type { WarmUpRepository } from './warmUpRepository'

/**
 * Everything one account's data is kept in. The screen holds one for as long as
 * it is up and talks only to the interfaces here, so which service keeps the
 * data — the account's Firestore collections, or this browser as guest — is
 * decided in this file and nowhere else.
 */
export interface AccountStorage {
  readonly tasks: TaskRepository
  readonly lists: ListRepository
  readonly tags: TagRepository
  readonly prizes: PrizeRepository
  readonly rewards: RewardRepository
  readonly warmUp: WarmUpRepository
  readonly procrastination: ProcrastinationRepository
  /** How the owner wants to be nudged: on, the span, the hours (STORE-46). */
  readonly nudge: NudgeRepository
  /** The Balance page's categories (BAL-1). */
  readonly categories: CategoryRepository
  readonly sync: SyncMonitor
  readonly backup: BackupRepository
  /**
   * Moves into the account what this browser kept apart from it — tasks from
   * before accounts (STORE-19), the nudge setting from before it synced
   * (STORE-46), and whatever was kept as guest (STORE-38) — the first time it
   * is open here online. Never rejects: a move that fails is tried again the
   * next time.
   */
  moveBrowserDataIn(): Promise<void>
}

/**
 * Moves the nudge setting this browser kept before the nudge became the
 * account's (STORE-46) into the account, where the account has none of its own,
 * and then forgets it here — the same rule as the tasks kept from before there
 * were accounts (STORE-19). What the nudge still keeps on the device, the
 * moment it last spoke here, is left where it is.
 */
async function moveDeviceNudgeIn(nudge: NudgeRepository): Promise<void> {
  const legacy = loadLegacyNudge()
  if (legacy === null) return
  try {
    await nudge.importNudge(legacy)
    forgetLegacyNudge()
  } catch (error) {
    console.warn('Could not move the nudge setting kept in this browser into the account; will try again next time.', error)
  }
}

/** A Google account's data, in Firestore under `users/{accountId}` (`firestore.rules`). */
function createFirestoreAccountStorage(accountId: string): AccountStorage {
  const tasks = createFirestoreTaskRepository(firestore, accountId)
  const lists = createFirestoreListRepository(firestore, accountId)
  const tags = createFirestoreTagRepository(firestore, accountId)
  const prizes = createFirestorePrizeRepository(firestore, accountId)
  const rewards = createFirestoreRewardRepository(firestore, accountId)
  const warmUp = createFirestoreWarmUpRepository(firestore, accountId)
  const nudge = createFirestoreNudgeRepository(firestore, accountId)
  const categories = createFirestoreCategoryRepository(firestore, accountId)

  return {
    tasks,
    lists,
    tags,
    prizes,
    rewards,
    warmUp,
    nudge,
    categories,
    procrastination: createFirestoreProcrastinationRepository(firestore, accountId),
    sync: createFirestoreSyncMonitor(firestore, accountId),
    backup: createFirestoreBackupRepository(firestore, accountId),
    async moveBrowserDataIn() {
      await Promise.all([
        importLocalTasks(tasks).catch((error: unknown) => {
          console.warn('Could not move the tasks kept in this browser into the account; will try again next time.', error)
        }),
        importGuestAccount(tasks, lists, tags, prizes, rewards, warmUp, nudge, categories).catch((error: unknown) => {
          console.warn('Could not move the guest data into the account; will try again next time.', error)
        }),
      ])
      // After the guest's, so the two never race for the one nudge setting: a
      // guest's is the newer of the two, having been set with accounts around.
      await moveDeviceNudgeIn(nudge)
    },
  }
}

/** The guest's data, in this browser's `localStorage` alone (STORE-37). */
function createGuestAccountStorage(): AccountStorage {
  const nudge = createLocalNudgeRepository()

  return {
    tasks: createLocalTaskRepository(),
    lists: createLocalListRepository(),
    tags: createLocalTagRepository(),
    prizes: createLocalPrizeRepository(),
    rewards: createLocalRewardRepository(),
    warmUp: createLocalWarmUpRepository(),
    nudge,
    categories: createLocalCategoryRepository(),
    procrastination: createLocalProcrastinationRepository(),
    sync: createLocalSyncMonitor(),
    backup: createLocalBackupRepository(),
    // The guest's tasks take in those kept from before accounts themselves
    // (localTaskRepository); the nudge setting is the one thing left to move.
    moveBrowserDataIn: () => moveDeviceNudgeIn(nudge),
  }
}

export function createAccountStorage(account: Account): AccountStorage {
  return account.provider === 'guest' ? createGuestAccountStorage() : createFirestoreAccountStorage(account.id)
}

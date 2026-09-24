import type { Account } from './authService'
import type { BackupRepository } from './backupRepository'
import { firestore } from './firebaseApp'
import { createFirestoreBackupRepository } from './firestoreBackupRepository'
import { createFirestoreListRepository } from './firestoreListRepository'
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
import { createLocalListRepository } from './localListRepository'
import { createLocalPrizeRepository } from './localPrizeRepository'
import { createLocalProcrastinationRepository } from './localProcrastinationRepository'
import { createLocalRewardRepository } from './localRewardRepository'
import { createLocalSyncMonitor } from './localSyncMonitor'
import { createLocalTagRepository } from './localTagRepository'
import { importLocalTasks } from './localTaskImport'
import { createLocalTaskRepository } from './localTaskRepository'
import { createLocalWarmUpRepository } from './localWarmUpRepository'
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
  readonly sync: SyncMonitor
  readonly backup: BackupRepository
  /**
   * Moves into the account what this browser kept apart from it — tasks from
   * before accounts (STORE-19), and whatever was kept as guest (STORE-38) — the
   * first time it is open here online. Nothing to do as guest. Never rejects: a
   * move that fails is tried again the next time.
   */
  moveBrowserDataIn(): Promise<void>
}

/** A Google account's data, in Firestore under `users/{accountId}` (`firestore.rules`). */
function createFirestoreAccountStorage(accountId: string): AccountStorage {
  const tasks = createFirestoreTaskRepository(firestore, accountId)
  const lists = createFirestoreListRepository(firestore, accountId)
  const tags = createFirestoreTagRepository(firestore, accountId)
  const prizes = createFirestorePrizeRepository(firestore, accountId)
  const rewards = createFirestoreRewardRepository(firestore, accountId)
  const warmUp = createFirestoreWarmUpRepository(firestore, accountId)

  return {
    tasks,
    lists,
    tags,
    prizes,
    rewards,
    warmUp,
    procrastination: createFirestoreProcrastinationRepository(firestore, accountId),
    sync: createFirestoreSyncMonitor(firestore, accountId),
    backup: createFirestoreBackupRepository(firestore, accountId),
    async moveBrowserDataIn() {
      await Promise.all([
        importLocalTasks(tasks).catch((error: unknown) => {
          console.warn('Could not move the tasks kept in this browser into the account; will try again next time.', error)
        }),
        importGuestAccount(tasks, lists, tags, prizes, rewards, warmUp).catch((error: unknown) => {
          console.warn('Could not move the guest data into the account; will try again next time.', error)
        }),
      ])
    },
  }
}

/** The guest's data, in this browser's `localStorage` alone (STORE-37). */
function createGuestAccountStorage(): AccountStorage {
  return {
    tasks: createLocalTaskRepository(),
    lists: createLocalListRepository(),
    tags: createLocalTagRepository(),
    prizes: createLocalPrizeRepository(),
    rewards: createLocalRewardRepository(),
    warmUp: createLocalWarmUpRepository(),
    procrastination: createLocalProcrastinationRepository(),
    sync: createLocalSyncMonitor(),
    backup: createLocalBackupRepository(),
    // The guest's tasks take in those kept from before accounts themselves (localTaskRepository).
    moveBrowserDataIn: () => Promise.resolve(),
  }
}

export function createAccountStorage(account: Account): AccountStorage {
  return account.provider === 'guest' ? createGuestAccountStorage() : createFirestoreAccountStorage(account.id)
}

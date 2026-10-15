import type { ActivityRepository } from './activityRepository'
import type { Account } from './authService'
import type { BackupRepository } from './backupRepository'
import type { CategoryRepository } from './categoryRepository'
import type { CheckInRepository } from './checkInRepository'
import type { FeatureRepository } from './featureRepository'
import { firestore } from './firebaseApp'
import { createFirestoreActivityRepository } from './firestoreActivityRepository'
import { createFirestoreBackupRepository } from './firestoreBackupRepository'
import { createFirestoreCategoryRepository } from './firestoreCategoryRepository'
import { createFirestoreCheckInRepository } from './firestoreCheckInRepository'
import { createFirestoreFeatureRepository } from './firestoreFeatureRepository'
import { createFirestoreGoalRepository } from './firestoreGoalRepository'
import { createFirestoreHabitSettingsRepository } from './firestoreHabitSettingsRepository'
import { createFirestoreJournalRepository } from './firestoreJournalRepository'
import { createFirestoreListRepository } from './firestoreListRepository'
import { createFirestoreNoteRepository } from './firestoreNoteRepository'
import { createFirestoreNudgeRepository } from './firestoreNudgeRepository'
import { createFirestorePrizeRepository } from './firestorePrizeRepository'
import { createFirestoreProcrastinationRepository } from './firestoreProcrastinationRepository'
import { createFirestoreRewardRepository } from './firestoreRewardRepository'
import { createFirestoreSharing } from './firestoreSharing'
import { createFirestoreSyncMonitor } from './firestoreSyncMonitor'
import { createFirestoreTagRepository } from './firestoreTagRepository'
import { createFirestoreTaskRepository } from './firestoreTaskRepository'
import { createFirestoreWarmUpRepository } from './firestoreWarmUpRepository'
import { createFirestoreXpRepository } from './firestoreXpRepository'
import type { GoalRepository } from './goalRepository'
import { importGuestAccount } from './guestImport'
import type { HabitSettingsRepository } from './habitSettingsRepository'
import type { JournalRepository } from './journalRepository'
import type { ListRepository } from './listRepository'
import { createLocalActivityRepository } from './localActivityRepository'
import { createLocalBackupRepository } from './localBackupRepository'
import { createLocalCategoryRepository } from './localCategoryRepository'
import { createLocalCheckInRepository } from './localCheckInRepository'
import { createLocalFeatureRepository } from './localFeatureRepository'
import { createLocalGoalRepository } from './localGoalRepository'
import { createLocalHabitSettingsRepository } from './localHabitSettingsRepository'
import { createLocalJournalRepository } from './localJournalRepository'
import { createLocalListRepository } from './localListRepository'
import { createLocalNoteRepository } from './localNoteRepository'
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
import { createLocalXpRepository } from './localXpRepository'
import type { NoteRepository } from './noteRepository'
import type { NudgeRepository } from './nudgeRepository'
import type { PrizeRepository } from './prizeRepository'
import type { ProcrastinationRepository } from './procrastinationRepository'
import type { RewardRepository } from './rewardRepository'
import type { SyncMonitor } from './syncMonitor'
import type { TagRepository } from './tagRepository'
import type { TaskRepository } from './taskRepository'
import type { WarmUpRepository } from './warmUpRepository'
import type { XpRepository } from './xpRepository'

/**
 * Everything one account's data is kept in. The screen holds one for as long as
 * it is up and talks only to the interfaces here, so which service keeps the
 * data — the account's Firestore collections, or this browser as guest — is
 * decided in this file and nowhere else.
 */
export interface AccountStorage {
  /** The account's tasks, and those in lists others shared with it (LST-27). */
  readonly tasks: TaskRepository
  /** The account's lists, whom each is shared with, and the lists others shared with it. */
  readonly lists: ListRepository
  /**
   * Whether lists can be shared from here (LST-27): a Google account, with an
   * address to be found by. A guest has none, and nothing is shared with one.
   */
  readonly canShare: boolean
  /** The goals tasks are done for (GOAL-1). */
  readonly goals: GoalRepository
  readonly tags: TagRepository
  readonly prizes: PrizeRepository
  readonly rewards: RewardRepository
  readonly warmUp: WarmUpRepository
  readonly procrastination: ProcrastinationRepository
  /** How the owner wants to be nudged: on, the span, the hours (STORE-46). */
  readonly nudge: NudgeRepository
  /** The Balance page's categories (BAL-1). */
  readonly categories: CategoryRepository
  /** The activity log, a day at a time (ACT-1). */
  readonly activities: ActivityRepository
  /** Whether the check-in is on, and the hours it keeps to (STORE-52). */
  readonly checkIn: CheckInRepository
  /** Which features are switched off on Settings (STORE-56). */
  readonly features: FeatureRepository
  /** The habits' settings the account keeps: the limit on rests (STORE-63). */
  readonly habitSettings: HabitSettingsRepository
  /** The journal, a day at a time, a week of it (JRN-1). */
  readonly journal: JournalRepository
  /** The notes, one record each (NOTE-1). */
  readonly notes: NoteRepository
  /** What was gained and lost in XP, a day at a time, and where it stands (LVL-1). */
  readonly xp: XpRepository
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

/**
 * A Google account's data, in Firestore under `users/{accountId}`, and the lists
 * it shares and is shared, between accounts (`firestore.rules`).
 */
function createFirestoreAccountStorage(account: Account): AccountStorage {
  const accountId = account.id
  const own = {
    tasks: createFirestoreTaskRepository(firestore, accountId),
    lists: createFirestoreListRepository(firestore, accountId),
  }
  // Signed in with Google there is always an address; without one there is no sharing.
  const canShare = account.email !== null
  const { tasks, lists } =
    account.email === null
      ? own
      : createFirestoreSharing(firestore, { id: accountId, email: account.email, name: account.name }, own)
  const goals = createFirestoreGoalRepository(firestore, accountId)
  const tags = createFirestoreTagRepository(firestore, accountId)
  const prizes = createFirestorePrizeRepository(firestore, accountId)
  const rewards = createFirestoreRewardRepository(firestore, accountId)
  const warmUp = createFirestoreWarmUpRepository(firestore, accountId)
  const nudge = createFirestoreNudgeRepository(firestore, accountId)
  const categories = createFirestoreCategoryRepository(firestore, accountId)
  const activities = createFirestoreActivityRepository(firestore, accountId)
  const checkIn = createFirestoreCheckInRepository(firestore, accountId)
  const features = createFirestoreFeatureRepository(firestore, accountId)
  const habitSettings = createFirestoreHabitSettingsRepository(firestore, accountId)
  const journal = createFirestoreJournalRepository(firestore, accountId)
  const notes = createFirestoreNoteRepository(firestore, accountId)
  const xp = createFirestoreXpRepository(firestore, accountId)

  return {
    tasks,
    lists,
    canShare,
    goals,
    tags,
    prizes,
    rewards,
    warmUp,
    nudge,
    categories,
    activities,
    checkIn,
    features,
    habitSettings,
    journal,
    notes,
    xp,
    procrastination: createFirestoreProcrastinationRepository(firestore, accountId),
    sync: createFirestoreSyncMonitor(firestore, accountId),
    backup: createFirestoreBackupRepository(firestore, accountId),
    async moveBrowserDataIn() {
      await Promise.all([
        importLocalTasks(tasks).catch((error: unknown) => {
          console.warn('Could not move the tasks kept in this browser into the account; will try again next time.', error)
        }),
        importGuestAccount(tasks, lists, goals, tags, prizes, rewards, warmUp, nudge, categories, activities, checkIn, features, habitSettings, journal, notes, xp).catch((error: unknown) => {
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
    canShare: false,
    goals: createLocalGoalRepository(),
    tags: createLocalTagRepository(),
    prizes: createLocalPrizeRepository(),
    rewards: createLocalRewardRepository(),
    warmUp: createLocalWarmUpRepository(),
    nudge,
    categories: createLocalCategoryRepository(),
    activities: createLocalActivityRepository(),
    checkIn: createLocalCheckInRepository(),
    features: createLocalFeatureRepository(),
    habitSettings: createLocalHabitSettingsRepository(),
    journal: createLocalJournalRepository(),
    notes: createLocalNoteRepository(),
    xp: createLocalXpRepository(),
    procrastination: createLocalProcrastinationRepository(),
    sync: createLocalSyncMonitor(),
    backup: createLocalBackupRepository(),
    // The guest's tasks take in those kept from before accounts themselves
    // (localTaskRepository); the nudge setting is the one thing left to move.
    moveBrowserDataIn: () => moveDeviceNudgeIn(nudge),
  }
}

export function createAccountStorage(account: Account): AccountStorage {
  return account.provider === 'guest' ? createGuestAccountStorage() : createFirestoreAccountStorage(account)
}

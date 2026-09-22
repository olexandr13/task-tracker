import { collection, type CollectionReference, type Firestore } from 'firebase/firestore'

/**
 * Every collection an account's data is kept in, each at `users/{accountId}/{name}`.
 * A new one is added here, and so is watched by whatever watches all of the
 * account's data (`firestoreSyncMonitor.ts`) — and to the backup
 * (`firestoreBackupRepository.ts`, `backupFile.ts`), or no export holds it.
 * Who may read each: `firestore.rules`.
 */
export const ACCOUNT_COLLECTIONS = ['tasks', 'lists', 'tags', 'rewardDays', 'redemptions', 'rewardGoals'] as const

export type AccountCollection = (typeof ACCOUNT_COLLECTIONS)[number]

export function accountCollection(firestore: Firestore, accountId: string, name: AccountCollection): CollectionReference {
  return collection(firestore, 'users', accountId, name)
}

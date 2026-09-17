import { writeBatch, type Firestore, type WriteBatch } from 'firebase/firestore'

/** The most writes Firestore takes in one batch. */
const BATCH_LIMIT = 500

/** One write, to be put in whichever batch it falls in. */
export type BatchWrite = (batch: WriteBatch) => void

/**
 * Commits the writes in as many batches as they need. Every batch is committed
 * at once rather than one after another: a commit only settles when the server
 * has it, and offline that waits, but the write itself is already queued in the
 * browser.
 */
export async function commitInBatches(firestore: Firestore, writes: readonly BatchWrite[]): Promise<void> {
  const batches: WriteBatch[] = []
  for (let start = 0; start < writes.length; start += BATCH_LIMIT) {
    const batch = writeBatch(firestore)
    writes.slice(start, start + BATCH_LIMIT).forEach((write) => { write(batch) })
    batches.push(batch)
  }
  await Promise.all(batches.map((batch) => batch.commit()))
}

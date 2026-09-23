import type { BackupFailure } from '../storage/backupFile'
import type { ImportSummary, RecordCounts } from '../storage/backupRepository'

/**
 * How a backup reads on screen. What a file holds and what an import adds are
 * worked out in ../storage; wording is presentation, so it stays here.
 */

export const EXPORT_FAILED = 'Couldn’t export. Try again.'

export const IMPORT_OFFLINE = 'Importing needs a connection. Try again once you’re online.'

/** Importing again is safe: whatever did arrive is already here, and is left as it is. */
export const IMPORT_FAILED = 'Couldn’t finish importing. Try again — anything already imported is left as it is.'

export const BACKUP_FAILURES: Record<BackupFailure, string> = {
  'not-a-backup': 'That file isn’t a PickMe backup.',
  'newer-version': 'That backup was made by a newer version of the app. Reload the page to update it, then try again.',
}

/** `12 tasks, 2 lists, 3 tags, 4 prizes, 30 completions and 1 redemption`, leaving out any kind there are none of. Null for none at all. */
export function describeRecordCounts(counts: RecordCounts): string | null {
  const parts = [
    countOf(counts.tasks, 'task'),
    countOf(counts.lists, 'list'),
    countOf(counts.tags, 'tag'),
    countOf(counts.prizes, 'prize'),
    countOf(counts.completions, 'completion'),
    countOf(counts.redemptions, 'redemption'),
  ].filter((part) => part !== null)

  if (parts.length === 0) return null
  if (parts.length === 1) return parts[0]
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
}

/** What an export put in the file. */
export function describeExport(counts: RecordCounts): string {
  const described = describeRecordCounts(counts)
  return described === null ? 'Exported an empty account: there is nothing in it yet.' : `Exported ${described}.`
}

/** What an import added, what it left alone, and what in the file it could not read. */
export function describeImport({ added, alreadyHere }: ImportSummary, unreadable: number): string {
  const described = describeRecordCounts(added)
  const sentences = [described === null ? 'Nothing new to import.' : `Imported ${described}.`]

  if (alreadyHere > 0) {
    sentences.push(
      alreadyHere === 1
        ? '1 record was already here and is left as it is.'
        : `${String(alreadyHere)} records were already here and are left as they are.`,
    )
  }
  if (unreadable > 0) {
    sentences.push(
      unreadable === 1
        ? '1 record in the file couldn’t be read and was left out.'
        : `${String(unreadable)} records in the file couldn’t be read and were left out.`,
    )
  }
  return sentences.join(' ')
}

function countOf(count: number, noun: string): string | null {
  return count === 0 ? null : `${String(count)} ${noun}${count === 1 ? '' : 's'}`
}

import { useCallback, useState } from 'react'
import { backupFileName, readBackupFile, writeBackupFile } from '../storage/backupFile'
import { countRecords, NeedsConnectionError, type BackupRepository } from '../storage/backupRepository'
import {
  BACKUP_FAILURES,
  describeExport,
  describeImport,
  EXPORT_FAILED,
  IMPORT_FAILED,
  IMPORT_OFFLINE,
} from './backupLabels'
import { downloadFile } from './downloadFile'

/** Where a backup stands: nothing asked yet, one under way, or how the last one went. */
export type BackupStatus =
  | { readonly state: 'idle' }
  | { readonly state: 'working'; readonly action: 'export' | 'import' }
  | { readonly state: 'done' | 'failed'; readonly message: string }

/** Hands a finished file to the person to keep: the browser's download, or a stand-in in tests. */
export type SaveFile = (name: string, text: string) => void

/**
 * Exporting the account's data to a file, and importing one back. The file's
 * shape lives in ../storage/backupFile and what an import adds in
 * ../storage/backupRepository; this runs them and says how it went.
 *
 * An import is never written to the screen by hand: what it adds arrives
 * through the tasks', lists' and points' own subscriptions, like a change made
 * on another device. And, like one, it is not recorded as earning anything
 * again — the points it brings are the ones in the file.
 */
export function useBackup(repository: BackupRepository, saveFile: SaveFile = downloadFile) {
  const [status, setStatus] = useState<BackupStatus>({ state: 'idle' })

  const exportAll = useCallback(async () => {
    setStatus({ state: 'working', action: 'export' })
    try {
      const data = await repository.exportAll()
      const now = new Date()
      saveFile(backupFileName(now), writeBackupFile(data, now))
      setStatus({ state: 'done', message: describeExport(countRecords(data)) })
    } catch (error) {
      console.error('Could not export the account.', error)
      setStatus({ state: 'failed', message: EXPORT_FAILED })
    }
  }, [repository, saveFile])

  const importFile = useCallback(
    async (file: Blob) => {
      setStatus({ state: 'working', action: 'import' })
      try {
        const read = readBackupFile(await file.text())
        if (typeof read === 'string') {
          setStatus({ state: 'failed', message: BACKUP_FAILURES[read] })
          return
        }

        const summary = await repository.importAll(read.data, new Date())
        setStatus({ state: 'done', message: describeImport(summary, read.unreadable) })
      } catch (error) {
        // Being offline is a state of affairs, not a fault: said on screen, not logged.
        if (error instanceof NeedsConnectionError) {
          setStatus({ state: 'failed', message: IMPORT_OFFLINE })
          return
        }
        console.error('Could not import the backup.', error)
        setStatus({ state: 'failed', message: IMPORT_FAILED })
      }
    },
    [repository],
  )

  return { status, exportAll, importFile }
}

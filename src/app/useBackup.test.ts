// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createList, createTask } from '../core'
import { BACKUP_VERSION, writeBackupFile } from '../storage/backupFile'
import { NeedsConnectionError, type AccountData, type BackupRepository, type ImportSummary } from '../storage/backupRepository'
import { consoleOutput, expectConsole } from '../test/consoleGuard'
import { BACKUP_FAILURES, EXPORT_FAILED, IMPORT_FAILED, IMPORT_OFFLINE } from './backupLabels'
import { useBackup } from './useBackup'

/* Exporting and importing, and what is said about it. BAK ids refer to wiki/backup.md. */

const AT = new Date('2026-09-19T09:00:00.000Z')

const WRITE = createTask('Write report', null, AT)
const DATA: AccountData = { tasks: [WRITE], lists: [createList('Work', AT)], entries: [], redemptions: [] }

const ADDED: ImportSummary = { added: { tasks: 1, lists: 1, completions: 0, redemptions: 0 }, alreadyHere: 0 }

function fakeBackupRepository({ exportFails = false, importFails = null as unknown }: { exportFails?: boolean; importFails?: unknown } = {}) {
  const imported: AccountData[] = []
  const repository: BackupRepository = {
    exportAll: () => (exportFails ? Promise.reject(new Error('permission denied')) : Promise.resolve(DATA)),
    importAll(data) {
      imported.push(data)
      return importFails === null ? Promise.resolve(ADDED) : Promise.reject(importFails)
    },
  }
  return { repository, imported }
}

function setUp(options?: Parameters<typeof fakeBackupRepository>[0]) {
  const { repository, imported } = fakeBackupRepository(options)
  const saveFile = vi.fn<(name: string, text: string) => void>()
  const { result } = renderHook(() => useBackup(repository, saveFile))
  return { result, saveFile, imported }
}

const fileOf = (text: string) => new File([text], 'backup.json', { type: 'application/json' })

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(AT)
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('exporting', () => {
  it('hands over a backup of the account, named for the day, and says what is in it (BAK-1)', async () => {
    const { result, saveFile } = setUp()

    await act(() => result.current.exportAll())

    expect(saveFile).toHaveBeenCalledWith('task-tracker-backup-2026-09-19.json', writeBackupFile(DATA, AT))
    expect(result.current.status).toEqual({ state: 'done', message: 'Exported 1 task and 1 list.' })
  })

  it('says so when the account cannot be read, and saves nothing', async () => {
    expectConsole('Could not export the account.')
    const { result, saveFile } = setUp({ exportFails: true })

    await act(() => result.current.exportAll())

    expect(saveFile).not.toHaveBeenCalled()
    expect(result.current.status).toEqual({ state: 'failed', message: EXPORT_FAILED })
  })
})

describe('importing', () => {
  it('adds what the file holds and says what came of it (BAK-5, BAK-10)', async () => {
    const { result, imported } = setUp()

    await act(() => result.current.importFile(fileOf(writeBackupFile(DATA, AT))))

    expect(imported).toEqual([DATA])
    expect(result.current.status).toEqual({ state: 'done', message: 'Imported 1 task and 1 list.' })
  })

  it('turns away a file that is not a backup without touching the account (BAK-9)', async () => {
    const { result, imported } = setUp()

    await act(() => result.current.importFile(fileOf('{"hello": "world"}')))

    expect(imported).toEqual([])
    expect(result.current.status).toEqual({ state: 'failed', message: BACKUP_FAILURES['not-a-backup'] })
  })

  it('turns away a backup from a newer version of the app (BAK-9)', async () => {
    const { result, imported } = setUp()
    const newer = JSON.stringify({ ...(JSON.parse(writeBackupFile(DATA, AT)) as object), version: BACKUP_VERSION + 1 })

    await act(() => result.current.importFile(fileOf(newer)))

    expect(imported).toEqual([])
    expect(result.current.status).toEqual({ state: 'failed', message: BACKUP_FAILURES['newer-version'] })
  })

  it('says a connection is needed when there is none, as a fact rather than a fault (BAK-11)', async () => {
    const { result } = setUp({ importFails: new NeedsConnectionError() })

    await act(() => result.current.importFile(fileOf(writeBackupFile(DATA, AT))))

    expect(result.current.status).toEqual({ state: 'failed', message: IMPORT_OFFLINE })
    expect(consoleOutput()).toEqual([])
  })

  it('says so when the import cannot be finished (BAK-11)', async () => {
    expectConsole('Could not import the backup.')
    const { result } = setUp({ importFails: new Error('permission denied') })

    await act(() => result.current.importFile(fileOf(writeBackupFile(DATA, AT))))

    expect(result.current.status).toEqual({ state: 'failed', message: IMPORT_FAILED })
  })
})

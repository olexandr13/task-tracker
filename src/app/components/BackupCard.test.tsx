// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { BackupStatus } from '../useBackup'
import { BackupCard } from './BackupCard'

/* Export and import on Settings. BAK ids refer to wiki/backup.md. */

afterEach(cleanup)

function setup(status: BackupStatus = { state: 'idle' }) {
  const user = userEvent.setup()
  const onExport = vi.fn()
  const onImport = vi.fn<(file: File) => void>()
  render(<BackupCard status={status} onExport={onExport} onImport={onImport} />)
  return { user, onExport, onImport }
}

const backupFile = () => new File(['{}'], 'task-tracker-backup-2026-09-19.json', { type: 'application/json' })

describe('BackupCard', () => {
  it('exports on a click (BAK-1)', async () => {
    const { user, onExport } = setup()

    await user.click(screen.getByRole('button', { name: 'Export' }))

    expect(onExport).toHaveBeenCalledOnce()
  })

  it('imports the file picked (BAK-4)', async () => {
    const { user, onImport } = setup()
    const file = backupFile()

    await user.upload(screen.getByLabelText('Import'), file)

    expect(onImport).toHaveBeenCalledWith(file)
  })

  it('takes the same file a second time (BAK-4)', async () => {
    const { user, onImport } = setup()
    const file = backupFile()

    await user.upload(screen.getByLabelText('Import'), file)
    await user.upload(screen.getByLabelText('Import'), file)

    expect(onImport).toHaveBeenCalledTimes(2)
  })

  it('opens the picker from the keyboard, the focus on Import (BAK-4)', async () => {
    const { user } = setup()

    await user.tab()
    await user.tab()

    expect(document.activeElement).toBe(screen.getByLabelText('Import'))
  })

  it('offers neither while one is under way, and says which (BAK-4)', () => {
    setup({ state: 'working', action: 'import' })

    expect((screen.getByRole('button', { name: 'Export' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByLabelText('Importing…') as HTMLInputElement).disabled).toBe(true)
  })

  it('says how it went (BAK-10)', () => {
    setup({ state: 'done', message: 'Imported 3 tasks.' })

    expect(screen.getByRole('status').textContent).toBe('Imported 3 tasks.')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('says what went wrong out loud (BAK-9, BAK-11)', () => {
    setup({ state: 'failed', message: 'That file isn’t a PickMe backup.' })

    expect(screen.getByRole('alert').textContent).toBe('That file isn’t a PickMe backup.')
    expect(screen.getByRole('status').textContent).toBe('')
  })
})

// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Account } from '../../storage/authService'
import { SettingsList } from './SettingsList'

/* The settings page. UI ids refer to wiki/interface.md. */

afterEach(cleanup)

const ADA: Account = {
  id: 'uid-ada',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  provider: 'google',
}

describe('SettingsList', () => {
  it('shows which version of the app is open (UI-35)', () => {
    render(
      <SettingsList
        account={ADA}
        onSignOut={vi.fn()}
        backup={{ state: 'idle' }}
        onExport={vi.fn()}
        onImport={vi.fn()}
      />,
    )

    expect(screen.getByText(`Version ${__APP_VERSION__}`)).not.toBeNull()
  })
})

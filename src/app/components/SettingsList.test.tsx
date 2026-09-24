// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Account } from '../../storage/authService'
import { NUDGE_RESTING } from '../../storage/nudgeRepository'
import type { NudgeControl } from '../useNudge'
import { SettingsList } from './SettingsList'

/* The settings page. UI ids refer to wiki/interface.md. */

afterEach(cleanup)

const NUDGE: NudgeControl = {
  setting: NUDGE_RESTING,
  turnOn: vi.fn(),
  changeQuietHours: vi.fn(),
  permission: 'default',
  notice: null,
  dismiss: vi.fn(),
}

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
        theme="system"
        onThemeChange={vi.fn()}
        nudge={NUDGE}
      />,
    )

    expect(screen.getByText(`Version ${__APP_VERSION__}`)).not.toBeNull()
  })
})

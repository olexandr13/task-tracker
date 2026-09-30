// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Account } from '../../storage/authService'
import { SettingsList } from './SettingsList'

/* The settings page. UI ids refer to wiki/interface.md, HAB ids to wiki/habits.md. */

afterEach(cleanup)

const ADA: Account = {
  id: 'uid-ada',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  provider: 'google',
}

function renderSettings(props: Partial<ComponentProps<typeof SettingsList>> = {}) {
  return render(
    <SettingsList
      account={ADA}
      onSignOut={vi.fn()}
      backup={{ state: 'idle' }}
      onExport={vi.fn()}
      onImport={vi.fn()}
      theme="system"
      onThemeChange={vi.fn()}
      habitView={{ showDetails: false }}
      onHabitViewChange={vi.fn()}
      {...props}
    />,
  )
}

describe('SettingsList', () => {
  it('shows which version of the app is open (UI-35)', () => {
    renderSettings()

    expect(screen.getByText(`Version ${__APP_VERSION__}`)).not.toBeNull()
  })

  it('holds the habits switch under View settings, reporting how the cards start (UI-35, HAB-23)', () => {
    renderSettings({ habitView: { showDetails: true } })

    expect(screen.getByRole('heading', { name: 'View settings' })).not.toBeNull()
    expect(screen.getByRole('switch', { name: 'Show habit details by default' }).getAttribute('aria-checked')).toBe('true')
  })
})

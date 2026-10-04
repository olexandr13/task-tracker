// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import type { ComponentProps } from 'react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Account } from '../../storage/authService'
import { SettingsList } from './SettingsList'

/*
 * The settings page. UI ids refer to wiki/interface.md, HAB ids to wiki/habits.md, CHST ids to wiki/cases.md,
 * FEAT ids to wiki/features.md.
 */

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
      casesPractice={false}
      onCasesPracticeChange={vi.fn()}
      features={{ off: [], loading: false }}
      onFeatureChange={vi.fn()}
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

  it('holds Cases practice switch, off to begin with (UI-35, CHST-21)', async () => {
    const onCasesPracticeChange = vi.fn()
    renderSettings({ onCasesPracticeChange })

    expect(screen.getByRole('heading', { name: 'Cases' })).not.toBeNull()
    const practice = screen.getByRole('switch', { name: 'Practice mode' })
    expect(practice.getAttribute('aria-checked')).toBe('false')

    await userEvent.setup().click(practice)
    expect(onCasesPracticeChange).toHaveBeenCalledWith(true)
  })

  it('has a switch for every feature, each on for an account that never turned one off (FEAT-1)', () => {
    renderSettings()

    const features = within(screen.getByRole('region', { name: 'Features' }))
    for (const name of ['Habits', 'Rewards', 'Cases', 'Lists', 'Tags', 'Balance', 'Activity log', 'Modes', 'Progress bars', 'Daily quote', 'Reminders']) {
      expect(features.getByRole('switch', { name }).getAttribute('aria-checked')).toBe('true')
    }
  })

  it('turns a feature off from its switch (FEAT-1)', async () => {
    const onFeatureChange = vi.fn()
    renderSettings({ onFeatureChange })

    await userEvent.setup().click(within(screen.getByRole('region', { name: 'Features' })).getByRole('switch', { name: 'Daily quote' }))

    expect(onFeatureChange).toHaveBeenCalledWith('quote', false)
  })

  it('offers a part only while what it is part of is on (FEAT-4)', () => {
    renderSettings({ features: { off: ['rewards', 'tags'], loading: false } })

    const features = within(screen.getByRole('region', { name: 'Features' }))
    expect(features.getByRole('switch', { name: 'Rewards' }).getAttribute('aria-checked')).toBe('false')
    expect(features.queryByRole('switch', { name: 'Cases' })).toBeNull()
    expect(features.queryByRole('switch', { name: 'Balance' })).toBeNull()
  })

  it('offers no switch until the account has said how they stand (FEAT-8)', () => {
    renderSettings({ features: { off: [], loading: true } })

    const features = within(screen.getByRole('region', { name: 'Features' }))
    expect(features.queryAllByRole('switch')).toEqual([])
    expect(features.getByText('Loading…')).not.toBeNull()
  })

  it('leaves out the cards of a feature switched off (FEAT-3)', () => {
    renderSettings({ features: { off: ['habits', 'cases'], loading: false } })

    expect(screen.queryByRole('heading', { name: 'View settings' })).toBeNull()
    expect(screen.queryByRole('switch', { name: 'Practice mode' })).toBeNull()
  })
})

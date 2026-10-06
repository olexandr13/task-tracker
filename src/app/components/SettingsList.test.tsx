// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { useState, type ComponentProps } from 'react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Account } from '../../storage/authService'
import type { SettingsLayout } from '../../storage/settingsLayoutRepository'
import { SettingsList } from './SettingsList'

/*
 * The settings page. UI ids refer to wiki/interface.md, HAB ids to wiki/habits.md, CHST ids to wiki/cases.md,
 * FEAT ids to wiki/features.md, STORE ids to wiki/storage.md.
 */

afterEach(cleanup)

const ADA: Account = {
  id: 'uid-ada',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  provider: 'google',
}

type Props = ComponentProps<typeof SettingsList>

/** The page, with its layout held above it as the screen holds it, so folding takes effect. */
function Settings({ from, onFoldChange, ...props }: Partial<Props> & { from: SettingsLayout }) {
  const [layout, setLayout] = useState(from)
  return (
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
      casesCounting={{ countUnpaid: true, loading: false }}
      onCasesCountUnpaidChange={vi.fn()}
      casesPractice={false}
      onCasesPracticeChange={vi.fn()}
      features={{ off: [], loading: false }}
      onFeatureChange={vi.fn()}
      {...props}
      layout={layout}
      onFoldChange={(part, open) => {
        onFoldChange?.(part, open)
        setLayout((latest) => ({ ...latest, [part]: open }))
      }}
    />
  )
}

function renderSettings(props: Partial<Props> & { from?: SettingsLayout } = {}) {
  render(<Settings from={props.from ?? {}} {...props} />)
  return userEvent.setup()
}

const section = (name: string) => within(screen.getByRole('region', { name }))
const features = () => section('Features')

describe('the sections (UI-35)', () => {
  it('shows which version of the app is open', () => {
    renderSettings()

    expect(screen.getByText(`Version ${__APP_VERSION__}`)).not.toBeNull()
  })

  it('puts Account, Features and Appearance in that order, each open to begin with', () => {
    renderSettings()

    const headings = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
    expect(headings).toEqual(['Account', 'Features', 'Appearance'])
    for (const name of headings) {
      expect(screen.getByRole('button', { name: name ?? '' }).getAttribute('aria-expanded')).toBe('true')
    }
  })

  it('holds the account and its backup under Account', () => {
    renderSettings()

    expect(section('Account').getByText('Ada Lovelace')).not.toBeNull()
    expect(section('Account').getByRole('button', { name: 'Sign out' })).not.toBeNull()
    expect(section('Account').getByRole('button', { name: 'Export' })).not.toBeNull()
  })

  it('holds the theme under Appearance', () => {
    renderSettings()

    expect(section('Appearance').getByRole('radiogroup', { name: 'Theme' })).not.toBeNull()
  })

  it('folds a section away from its heading, and keeps it folded (STORE-57)', async () => {
    const onFoldChange = vi.fn()
    const user = renderSettings({ onFoldChange })

    await user.click(screen.getByRole('button', { name: 'Account' }))

    expect(onFoldChange).toHaveBeenLastCalledWith('account', false)
    expect(screen.getByRole('button', { name: 'Account' }).getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('button', { name: 'Sign out' })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Account' }))
    expect(screen.getByRole('button', { name: 'Sign out' })).not.toBeNull()
  })

  it('opens folded where this device left it folded', () => {
    renderSettings({ from: { features: false } })

    expect(screen.queryByRole('switch', { name: 'Daily quote' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Features' }).getAttribute('aria-expanded')).toBe('false')
  })
})

describe('the features (FEAT-1)', () => {
  it('has a switch for every feature, each on for an account that never turned one off', () => {
    renderSettings()

    for (const name of ['Habits', 'Rewards', 'Cases', 'Lists', 'Tags', 'Balance', 'Activity log', 'Modes', 'Progress bars', 'Daily quote', 'Reminders']) {
      expect(features().getByRole('switch', { name }).getAttribute('aria-checked')).toBe('true')
    }
  })

  it('turns a feature off from its switch', async () => {
    const onFeatureChange = vi.fn()
    const user = renderSettings({ onFeatureChange })

    await user.click(features().getByRole('switch', { name: 'Daily quote' }))

    expect(onFeatureChange).toHaveBeenCalledWith('quote', false)
  })

  it('offers a part only while what it is part of is on (FEAT-4)', () => {
    renderSettings({ features: { off: ['rewards', 'tags'], loading: false } })

    expect(features().getByRole('switch', { name: 'Rewards' }).getAttribute('aria-checked')).toBe('false')
    expect(features().queryByRole('switch', { name: 'Cases' })).toBeNull()
    expect(features().queryByRole('switch', { name: 'Balance' })).toBeNull()
  })

  it('offers no switch until the account has said how they stand (FEAT-8)', () => {
    renderSettings({ features: { off: [], loading: true } })

    expect(features().queryAllByRole('switch')).toEqual([])
    expect(features().getByText('Loading…')).not.toBeNull()
  })

  it('folds a feature’s own settings under its switch until its arrow is pressed (FEAT-10)', async () => {
    const onFoldChange = vi.fn()
    const user = renderSettings({ onFoldChange })

    const arrow = features().getByRole('button', { name: 'Cases settings' })
    expect(arrow.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('switch', { name: 'Count unrewarded tasks' })).toBeNull()

    await user.click(arrow)

    expect(onFoldChange).toHaveBeenLastCalledWith('cases', true)
    expect(features().getByRole('group', { name: 'Cases settings' })).not.toBeNull()
    expect(features().getByRole('switch', { name: 'Count unrewarded tasks' })).not.toBeNull()
  })

  it('has arrows only for the features with settings of their own (FEAT-10)', () => {
    renderSettings()

    const arrows = features()
      .getAllByRole('button', { name: / settings$/ })
      .map((button) => button.getAttribute('aria-label'))
    expect(arrows).toEqual(['Habits settings', 'Cases settings'])
  })

  it('leaves out the settings of a feature switched off (FEAT-3)', () => {
    renderSettings({ features: { off: ['habits', 'cases'], loading: false }, from: { habits: true, cases: true } })

    expect(features().queryByRole('button', { name: 'Habits settings' })).toBeNull()
    expect(features().queryByRole('button', { name: 'Cases settings' })).toBeNull()
    expect(screen.queryByRole('switch', { name: 'Show habit details by default' })).toBeNull()
    expect(screen.queryByRole('switch', { name: 'Practice mode' })).toBeNull()
    expect(screen.queryByRole('switch', { name: 'Count unrewarded tasks' })).toBeNull()
  })
})

describe('under Habits (HAB-23)', () => {
  const SWITCH = 'Show habit details by default'

  it('holds how the cards start, reporting whether it is on', () => {
    renderSettings({ habitView: { showDetails: true }, from: { habits: true } })

    const habits = within(features().getByRole('group', { name: 'Habits settings' }))
    expect(habits.getByRole('switch', { name: SWITCH }).getAttribute('aria-checked')).toBe('true')
  })

  it('hands a change straight on', async () => {
    const onHabitViewChange = vi.fn()
    const user = renderSettings({ onHabitViewChange, from: { habits: true } })

    await user.click(screen.getByRole('switch', { name: SWITCH }))

    expect(onHabitViewChange).toHaveBeenCalledWith({ showDetails: true })
  })

  it('names the switch alone, with no line under it and no picture beside it', () => {
    renderSettings({ from: { habits: true } })

    const control = screen.getByRole('switch', { name: SWITCH })
    expect(control.getAttribute('aria-describedby')).toBeNull()
    expect(control.querySelector('svg')).toBeNull()
  })
})

describe('under Cases (CHST-21, CHST-32)', () => {
  const cases = () => within(features().getByRole('group', { name: 'Cases settings' }))

  it('holds the practice switch, off to begin with', async () => {
    const onCasesPracticeChange = vi.fn()
    const user = renderSettings({ onCasesPracticeChange, from: { cases: true } })

    const practice = cases().getByRole('switch', { name: 'Practice mode' })
    expect(practice.getAttribute('aria-checked')).toBe('false')

    await user.click(practice)
    expect(onCasesPracticeChange).toHaveBeenCalledWith(true)
  })

  it('holds the switch for counting tasks without points, as the account has it', async () => {
    const onCasesCountUnpaidChange = vi.fn()
    const user = renderSettings({ onCasesCountUnpaidChange, from: { cases: true } })

    const counting = cases().getByRole('switch', { name: 'Count unrewarded tasks' })
    expect(counting.getAttribute('aria-checked')).toBe('true')

    await user.click(counting)
    expect(onCasesCountUnpaidChange).toHaveBeenCalledWith(false)
  })

  it('offers no counting switch until the account’s Cases settings have arrived', () => {
    renderSettings({ casesCounting: { countUnpaid: true, loading: true }, from: { cases: true } })

    expect(cases().queryByRole('switch', { name: 'Count unrewarded tasks' })).toBeNull()
    expect(cases().getByText('Loading…')).not.toBeNull()
    // Practice is this screen's alone, so it waits for nothing.
    expect(cases().getByRole('switch', { name: 'Practice mode' })).not.toBeNull()
  })
})

// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { FeaturesOff } from '../../core'
import { FeaturesContext } from '../features'
import { ReflectPage } from './ReflectPage'

/* Reflect's page. UI ids refer to wiki/interface.md, FEAT ids to wiki/features.md. */

afterEach(cleanup)

describe('ReflectPage', () => {
  it('links to Balance, the activity log and the journal, in the sidebar\'s order (UI-83, BAL-1, ACT-1, JRN-1)', () => {
    render(<ReflectPage onOpen={vi.fn()} />)

    expect(screen.getAllByRole('button').map((link) => link.textContent)).toEqual(['Balance', 'Activity log', 'Journal'])
  })

  it('opens each page it lists (UI-83)', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    render(<ReflectPage onOpen={onOpen} />)

    await user.click(screen.getByRole('button', { name: 'Balance' }))
    await user.click(screen.getByRole('button', { name: 'Activity log' }))
    await user.click(screen.getByRole('button', { name: 'Journal' }))

    expect(onOpen.mock.calls).toEqual([['balance'], ['activity'], ['journal']])
  })

  it('lists each as a link large enough for a finger (UI-49, UI-83)', () => {
    render(<ReflectPage onOpen={vi.fn()} />)

    const journal = screen.getByRole('button', { name: 'Journal' })
    expect(journal.className).toContain('min-h-14')
    expect(journal.className).toContain('text-lg')
  })

  it('lists no page switched off, Balance going with the tags (FEAT-2, FEAT-4)', () => {
    const off: FeaturesOff = ['tags', 'journal']
    render(
      <FeaturesContext value={off}>
        <ReflectPage onOpen={vi.fn()} />
      </FeaturesContext>,
    )

    expect(screen.getAllByRole('button').map((link) => link.textContent)).toEqual(['Activity log'])
  })
})

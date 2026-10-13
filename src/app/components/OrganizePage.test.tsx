// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { FeaturesOff } from '../../core'
import { FeaturesContext } from '../features'
import { OrganizePage } from './OrganizePage'

/* Organize's page. UI ids refer to wiki/interface.md, MODE ids to wiki/modes.md, FEAT ids to wiki/features.md. */

afterEach(cleanup)

describe('OrganizePage', () => {
  it('links to Tags and the notes, in the sidebar\'s order, and not to Modes (UI-81, TAG-18, NOTE-1, MODE-1)', () => {
    render(<OrganizePage onOpen={vi.fn()} />)

    expect(screen.getAllByRole('button').map((link) => link.textContent)).toEqual(['Tags', 'Notes'])
  })

  it('opens each page it lists (UI-81)', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    render(<OrganizePage onOpen={onOpen} />)

    await user.click(screen.getByRole('button', { name: 'Tags' }))
    await user.click(screen.getByRole('button', { name: 'Notes' }))

    expect(onOpen.mock.calls).toEqual([['tags'], ['notes']])
  })

  it('lists each as a link large enough for a finger (UI-49, UI-81)', () => {
    render(<OrganizePage onOpen={vi.fn()} />)

    const tags = screen.getByRole('button', { name: 'Tags' })
    expect(tags.className).toContain('min-h-14')
    expect(tags.className).toContain('text-lg')
  })

  it('lists no page switched off (FEAT-2)', () => {
    const off: FeaturesOff = ['notes']
    render(
      <FeaturesContext value={off}>
        <OrganizePage onOpen={vi.fn()} />
      </FeaturesContext>,
    )

    expect(screen.getAllByRole('button').map((link) => link.textContent)).toEqual(['Tags'])
  })
})

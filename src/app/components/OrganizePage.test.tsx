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
  it('links to Tags, the notes and Modes, in the sidebar\'s order (UI-81, TAG-18, NOTE-1, MODE-1)', () => {
    render(<OrganizePage onOpen={vi.fn()} />)

    expect(screen.getAllByRole('button').map((link) => link.textContent)).toEqual(['Tags', 'Notes', 'Modes'])
  })

  it('opens each page it lists (UI-81)', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    render(<OrganizePage onOpen={onOpen} />)

    await user.click(screen.getByRole('button', { name: 'Tags' }))
    await user.click(screen.getByRole('button', { name: 'Notes' }))
    await user.click(screen.getByRole('button', { name: 'Modes' }))

    expect(onOpen.mock.calls).toEqual([['tags'], ['notes'], ['modes']])
  })

  it('lists each as a link large enough for a finger (UI-49, UI-81)', () => {
    render(<OrganizePage onOpen={vi.fn()} />)

    const tags = screen.getByRole('button', { name: 'Tags' })
    expect(tags.className).toContain('min-h-14')
    expect(tags.className).toContain('text-lg')
  })

  it('says nothing of the modes while none is on (MODE-1)', () => {
    render(<OrganizePage onOpen={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Modes' }).textContent).not.toContain('on')
  })

  it('says how many modes are on, without being opened (MODE-1)', () => {
    render(<OrganizePage onOpen={vi.fn()} modesOn={2} />)

    expect(screen.getByRole('button', { name: 'Modes, 2 on' }).textContent).toContain('2 on')
  })

  it('switches no mode itself: the modes are a page (MODE-1)', () => {
    render(<OrganizePage onOpen={vi.fn()} modesOn={1} />)

    expect(screen.queryByRole('switch')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Procrastination' })).toBeNull()
  })

  it('lists no page switched off (FEAT-2)', () => {
    const off: FeaturesOff = ['notes']
    render(
      <FeaturesContext value={off}>
        <OrganizePage onOpen={vi.fn()} />
      </FeaturesContext>,
    )

    expect(screen.getAllByRole('button').map((link) => link.textContent)).toEqual(['Tags', 'Modes'])
  })
})

// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MorePage } from './MorePage'

/* More's page. UI ids refer to wiki/interface.md; JUST ids to wiki/just-one.md. */

afterEach(cleanup)

describe('MorePage', () => {
  it('lists Tags as a link large enough for a finger (UI-45, UI-49)', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    render(<MorePage onOpen={onOpen} />)

    const tags = screen.getByRole('button', { name: 'Tags' })
    expect(tags.className).toContain('min-h-14')
    expect(tags.className).toContain('text-lg')

    await user.click(tags)
    expect(onOpen).toHaveBeenCalledExactlyOnceWith('tags')
  })

  it('has no entry for the rewards: they have a tab and a sidebar entry of their own (RWD-19)', () => {
    render(<MorePage onOpen={vi.fn()} />)

    expect(screen.queryByRole('button', { name: 'Rewards' })).toBeNull()
  })

  it('offers Procrastination when available, and starts the mode (JUST-1)', async () => {
    const onStart = vi.fn()
    render(
      <MorePage
        onOpen={vi.fn()}
        procrastination={{
          phase: 'off',
          available: true,
          onStart,
          onEnd: vi.fn(),
        }}
      />,
    )

    const control = screen.getByRole('button', { name: 'Procrastination mode' })
    expect(control.textContent).toContain('Procrastination')
    await userEvent.click(control)
    expect(onStart).toHaveBeenCalledOnce()
  })

  it('ends Procrastination mode when pressed again while on (JUST-8)', async () => {
    const onEnd = vi.fn()
    render(
      <MorePage
        onOpen={vi.fn()}
        procrastination={{
          phase: 'focus',
          available: true,
          onStart: vi.fn(),
          onEnd,
        }}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Procrastination mode on' }))
    expect(onEnd).toHaveBeenCalledOnce()
  })

  it('hides Procrastination when it is not available (JUST-2)', () => {
    render(
      <MorePage
        onOpen={vi.fn()}
        procrastination={{
          phase: 'off',
          available: false,
          onStart: vi.fn(),
          onEnd: vi.fn(),
        }}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Procrastination mode' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Tags' })).toBeDefined()
  })
})

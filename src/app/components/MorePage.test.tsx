// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MorePage } from './MorePage'

/* The phone's More page. UI ids refer to wiki/interface.md. */

afterEach(cleanup)

describe('MorePage', () => {
  it('lists Tags and Rewards as links large enough for a finger (UI-45, UI-49)', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    render(<MorePage onOpen={onOpen} />)

    const tags = screen.getByRole('button', { name: 'Tags' })
    const rewards = screen.getByRole('button', { name: 'Rewards' })
    expect(tags.className).toContain('min-h-14')
    expect(tags.className).toContain('text-lg')
    expect(rewards.className).toContain('min-h-14')

    await user.click(tags)
    expect(onOpen).toHaveBeenCalledExactlyOnceWith('tags')

    await user.click(rewards)
    expect(onOpen).toHaveBeenLastCalledWith('rewards')
  })
})

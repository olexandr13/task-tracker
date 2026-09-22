// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Theme } from '../../storage/themeRepository'
import { ThemeCard } from './ThemeCard'

/* The theme on Settings (UI-63 in wiki/interface.md). */

afterEach(cleanup)

function checked(name: string) {
  return (screen.getByRole('radio', { name }) as HTMLInputElement).checked
}

describe('ThemeCard', () => {
  it('offers System, Light and Dark, with the current one chosen', () => {
    render(<ThemeCard theme="system" onChange={vi.fn()} />)

    expect(screen.getByRole('radiogroup', { name: 'Theme' })).not.toBeNull()
    expect(screen.getAllByRole('radio').map((radio) => radio.getAttribute('value'))).toEqual(['system', 'light', 'dark'])
    expect(checked('System')).toBe(true)
    expect(checked('Light')).toBe(false)
  })

  it('picks a theme with a click', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ThemeCard theme="dark" onChange={onChange} />)

    await user.click(screen.getByText('Light'))

    expect(onChange).toHaveBeenCalledExactlyOnceWith('light')
  })

  it('moves along the themes with the arrow keys, as a radio group does', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    function Card() {
      const [theme, setTheme] = useState<Theme>('system')
      return (
        <ThemeCard
          theme={theme}
          onChange={(next) => {
            onChange(next)
            setTheme(next)
          }}
        />
      )
    }
    render(<Card />)

    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'System' }))

    await user.keyboard('{ArrowRight}')
    expect(checked('Light')).toBe(true)
    await user.keyboard('{ArrowRight}')
    expect(checked('Dark')).toBe(true)
    expect(onChange.mock.calls).toEqual([['light'], ['dark']])
  })
})

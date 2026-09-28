// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { PanelIconRow } from './PanelIconRow'

/* The row of icon choices a panel draws, its spread capped by how many it holds (DUE-14). */

afterEach(cleanup)

describe('PanelIconRow', () => {
  it('tells its style how many icons it holds, which caps how far apart they spread (DUE-14)', () => {
    render(
      <PanelIconRow>
        {['Today', 'Tomorrow', 'Next week'].map((name) => (
          <button key={name} type="button" aria-label={name} />
        ))}
      </PanelIconRow>,
    )

    const row = screen.getByRole('button', { name: 'Today' }).parentElement
    expect(row?.style.getPropertyValue('--icons')).toBe('3')
  })

  it('counts again as icons come and go, a day set adding Remove date (DUE-14)', () => {
    const { rerender } = render(
      <PanelIconRow>
        <button type="button" aria-label="Today" />
      </PanelIconRow>,
    )
    const row = screen.getByRole('button', { name: 'Today' }).parentElement

    rerender(
      <PanelIconRow>
        <button type="button" aria-label="Today" />
        <button type="button" aria-label="Remove date" />
      </PanelIconRow>,
    )

    expect(row?.style.getPropertyValue('--icons')).toBe('2')
  })

  it('counts a list of icons and a button after it alike, the i at a row\'s end taking a slot too (DUE-25)', () => {
    render(
      <PanelIconRow>
        {['Today', 'Tomorrow', 'Next week'].map((name) => (
          <button key={name} type="button" aria-label={name} />
        ))}
        <button type="button" aria-label="What each icon means" />
      </PanelIconRow>,
    )

    const row = screen.getByRole('button', { name: 'Today' }).parentElement
    expect(row?.style.getPropertyValue('--icons')).toBe('4')
  })
})

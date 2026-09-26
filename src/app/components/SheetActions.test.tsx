// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { SheetActions } from './SheetActions'

/* The sheet's row of icons, and the i that names them. UI ids refer to the wiki. */

afterEach(cleanup)

function setup() {
  const user = userEvent.setup()
  render(
    <SheetActions
      label='What "write it up" has'
      actions={[
        { name: 'Date', detail: 'Tomorrow at 9:00 AM', control: <button type="button">Schedule</button> },
        { name: 'List', detail: 'Work', control: <button type="button">List</button> },
        { name: 'Tags', detail: null, control: <button type="button">Tag picker</button> },
      ]}
    />,
  )
  return user
}

const names = () => screen.getByRole('button', { name: 'What each button does' })

describe('SheetActions', () => {
  it('is one row of the task\'s controls, named for a screen reader (UI-63)', () => {
    setup()

    const row = screen.getByRole('group', { name: 'What "write it up" has' })
    expect(within(row).getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Schedule',
      'List',
      'Tag picker',
      '',
    ])
  })

  it('spells out what is set under the icons, and leaves out what is not (UI-63)', () => {
    setup()

    expect(screen.getByText('Tomorrow at 9:00 AM · Work')).toBeDefined()
  })

  it('names every icon while the i is on, and stops when it is off (UI-63)', async () => {
    const user = setup()

    expect(screen.queryByText('Date')).toBeNull()

    await user.click(names())
    expect(names()).toHaveProperty('ariaPressed', 'true')
    expect(screen.getByText('Date')).toBeDefined()
    expect(screen.getByText('Tags')).toBeDefined()

    await user.click(names())
    expect(names()).toHaveProperty('ariaPressed', 'false')
    expect(screen.queryByText('Date')).toBeNull()
  })

  it('says nothing under a row with nothing set', () => {
    render(<SheetActions label="What it has" actions={[{ name: 'Date', control: <button type="button">Schedule</button> }]} />)

    expect(screen.getByRole('group', { name: 'What it has' }).parentElement?.querySelector('p')).toBeNull()
  })
})

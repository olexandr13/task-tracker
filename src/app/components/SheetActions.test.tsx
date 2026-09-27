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
        { name: 'Date', detail: 'Tomorrow 09:00', control: <button type="button">Schedule</button> },
        { name: 'List', control: <button type="button">List</button> },
        { name: 'Tags', control: <button type="button">Tag picker</button> },
        { name: 'Reward', detail: '+5', control: <button type="button">Reward</button> },
      ]}
    />,
  )
  return user
}

const names = () => screen.getByRole('button', { name: 'What each button does' })
const column = (name: string) => screen.getByRole('button', { name }).parentElement as HTMLElement
/** What is written under a control, in the order it is read; the controls here are stubs with words of their own. */
const under = (name: string) => [...column(name).querySelectorAll('span')].map((span) => span.textContent)

describe('SheetActions', () => {
  it('is one row of the task\'s controls, named for a screen reader (UI-63)', () => {
    setup()

    const row = screen.getByRole('group', { name: 'What "write it up" has' })
    expect(within(row).getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Schedule',
      'List',
      'Tag picker',
      'Reward',
      '',
    ])
  })

  it('spells each value out under the icon it belongs to (UI-63)', () => {
    setup()

    expect(within(column('Schedule')).getByText('Tomorrow 09:00')).toBeDefined()
    expect(within(column('Reward')).getByText('+5')).toBeDefined()
  })

  it('leaves a control with no value to spell out as its icon alone (UI-63)', () => {
    setup()

    // A list and a row of tags are as long as they were typed, so the icon says
    // the task has one and the panel it opens says which.
    expect(under('List')).toEqual([])
    expect(under('Tag picker')).toEqual([])
  })

  it('names every icon while the i is on, above what it holds, and stops when it is off (UI-63)', async () => {
    const user = setup()

    expect(screen.queryByText('Date')).toBeNull()

    await user.click(names())
    expect(names()).toHaveProperty('ariaPressed', 'true')
    expect(under('Schedule')).toEqual(['Date', 'Tomorrow 09:00'])
    expect(screen.getByText('Tags')).toBeDefined()

    await user.click(names())
    expect(names()).toHaveProperty('ariaPressed', 'false')
    expect(screen.queryByText('Date')).toBeNull()
  })
})

// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PickerPanel } from './PickerPanel'

/* Which shape a picker's panel takes, and how it closes. UI ids refer to the wiki. */

afterEach(cleanup)

/** A picker, as every one of them is built: a button, and the panel it opens beside itself. */
function Picker() {
  const root = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div ref={root} className="relative">
      <button type="button" onClick={() => { setIsOpen(!isOpen) }}>
        Open
      </button>
      {isOpen && (
        <PickerPanel anchor={root} label="List" onClose={() => { setIsOpen(false) }}>
          <button type="button">Inbox</button>
        </PickerPanel>
      )}
    </div>
  )
}

/** A row like a task's, which holds a picker and re-renders around it. */
function Row({ nudge }: { nudge: number }) {
  return (
    <div>
      <p>{nudge}</p>
      <Picker />
    </div>
  )
}

function setup(inSheet: boolean) {
  const user = userEvent.setup()
  render(
    inSheet ? (
      <div role="dialog" aria-modal="true" aria-label='Details of "write it up"'>
        <Picker />
      </div>
    ) : (
      <Picker />
    ),
  )
  return user
}

const panel = () => screen.queryByRole('dialog', { name: 'List' })
const open = () => screen.getByRole('button', { name: 'Open' })

describe('PickerPanel', () => {
  it('hangs off its button on a row, and closes on a click outside it (UI-40)', async () => {
    const user = setup(false)

    await user.click(open())
    expect(panel()).not.toBeNull()
    // An aside has nothing between it and the page, so it is not a sheet's modal.
    expect(panel()?.getAttribute('aria-modal')).toBeNull()

    await user.click(document.body)
    expect(panel()).toBeNull()
  })

  it('is a sheet of its own when it opens from inside one (UI-64)', async () => {
    const user = setup(true)

    await user.click(open())

    // A sheet is only as tall as what it holds, so an aside dropped in it would be cut off.
    expect(panel()?.getAttribute('aria-modal')).toBe('true')
    expect(screen.getByRole('button', { name: 'Close' })).toBeDefined()
  })

  it('keeps the one ear on the page as the row it hangs off re-renders (UI-40)', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Row nudge={0} />)
    await user.click(open())

    const added = vi.spyOn(document, 'addEventListener')
    const removed = vi.spyOn(document, 'removeEventListener')
    rerender(<Row nudge={1} />)

    // A row rests on the very click that closes the panel, and it is listening
    // first. Were the panel's listener taken off and put back as that render went
    // by, the click would be over before it heard it — so it goes on once and stays.
    expect(screen.getByText('1')).toBeDefined()
    expect(added.mock.calls.filter(([type]) => type === 'pointerdown')).toHaveLength(0)
    expect(removed.mock.calls.filter(([type]) => type === 'pointerdown')).toHaveLength(0)
    expect(panel()).not.toBeNull()
  })

  it('leaves the sheet it came from open as it closes (UI-64)', async () => {
    const user = setup(true)

    await user.click(open())
    await user.keyboard('{Escape}')

    expect(panel()).toBeNull()
    expect(screen.getByRole('dialog', { name: 'Details of "write it up"' })).toBeDefined()
    expect(open()).toBeDefined()
  })
})

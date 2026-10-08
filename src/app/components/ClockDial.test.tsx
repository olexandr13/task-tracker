// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import type { LocalTime } from '../../core'
import { ClockDial } from './ClockDial'

/* The clock face the hour is picked off (DUE-24). */

/** Twenty past two, so the face opens on the hour coming — three in the afternoon. */
const NOW = new Date(2026, 8, 16, 14, 20)

afterEach(cleanup)

/** Keys that got past the face to the panel it sits in, which listens for its own. */
let reachedPanel = 0

/** Enters in the readout, which the holder takes as the hour wanted. */
let submitted = 0

/** The dial as it is used: the hour it is given back is the hour it shows. */
function setup(initial: LocalTime | null = null) {
  reachedPanel = 0
  submitted = 0

  function Holder() {
    const [time, setTime] = useState<LocalTime | null>(initial)
    return (
      <div onKeyDown={() => { reachedPanel += 1 }}>
        <ClockDial value={time} now={NOW} onChange={setTime} onSubmit={() => { submitted += 1 }} />
        <p>Due at {time ?? 'no hour'}</p>
      </div>
    )
  }

  const user = userEvent.setup()
  render(<Holder />)
  return user
}

const shows = (time: string) => screen.getByText(`Due at ${time}`)
const face = () => screen.getByRole('group', { name: /^(Hour|Minutes)$/ })
const hour = () => screen.getByRole<HTMLInputElement>('textbox', { name: 'Hour' })
const minutes = () => screen.getByRole<HTMLInputElement>('textbox', { name: 'Minutes' })

describe('picking the hour off the face', () => {
  it('sets the hour at a click, the hour on the face being the hour of the day', async () => {
    const user = setup()

    await user.click(screen.getByRole('button', { name: '15' }))

    expect(shows('15:00')).toBeDefined()
  })

  it('hands the face to the minutes once the hour is said', async () => {
    const user = setup()
    expect(face()).toHaveProperty('ariaLabel', 'Hour')

    await user.click(screen.getByRole('button', { name: '15' }))

    expect(face()).toHaveProperty('ariaLabel', 'Minutes')
    await user.click(screen.getByRole('button', { name: '25 minutes' }))
    expect(shows('15:25')).toBeDefined()
  })

  it('keeps the whole day on the face, midnight and noon both at the top', async () => {
    const user = setup('14:30')
    await user.click(screen.getByRole('button', { name: '12' }))
    expect(shows('12:30')).toBeDefined()

    await user.click(hour())
    await user.click(screen.getByRole('button', { name: '00' }))
    expect(shows('00:30')).toBeDefined()
  })

  it('puts the face back on the hour, an hour set a moment ago being changed on the spot', async () => {
    const user = setup('09:45')

    await user.click(hour())
    expect(face()).toHaveProperty('ariaLabel', 'Hour')
    await user.click(screen.getByRole('button', { name: '11' }))

    // The minutes are the hour's own: changing the hour leaves them where they were.
    expect(shows('11:45')).toBeDefined()
  })

  it('takes an evening hour off the inner ring, the morning hour beside it untouched', async () => {
    const user = setup('09:15')

    await user.click(screen.getByRole('button', { name: '21' }))
    expect(shows('21:15')).toBeDefined()

    // Back on the hour face, the evening hour is the one filled, not the morning one below it.
    await user.click(hour())
    expect(screen.getByRole('button', { name: '21' })).toHaveProperty('ariaPressed', 'true')
    expect(screen.getByRole('button', { name: '09' })).toHaveProperty('ariaPressed', 'false')
  })

  it('marks the number the hand rests on, and no other', async () => {
    setup('09:45')

    expect(screen.getByRole('button', { name: '09' })).toHaveProperty('ariaPressed', 'true')
    expect(screen.getByRole('button', { name: '10' })).toHaveProperty('ariaPressed', 'false')
  })
})

describe('the face with no hour set', () => {
  it('reads as blank rather than as an hour nobody picked', () => {
    setup()

    expect(hour().value).toBe('')
    expect(hour().placeholder).toBe('--')
    expect(minutes().placeholder).toBe('--')
    expect(screen.getByText('No time set')).toBeDefined()
  })

  it('keeps the minutes shut until there is an hour for them to hang on', async () => {
    const user = setup()
    expect(minutes()).toHaveProperty('disabled', true)

    await user.click(screen.getByRole('button', { name: '15' }))

    expect(minutes()).toHaveProperty('disabled', false)
  })
})

describe('the face by the keys', () => {
  it('is one stop for Tab, on the number the hand rests on', async () => {
    const user = setup('09:45')

    // The readout's two halves come first, each turning the face to itself; the
    // face is one stop after them, on the minutes the second half left it on.
    for (const _ of [1, 2, 3]) await user.tab()

    expect(document.activeElement).toHaveProperty('ariaLabel', '45 minutes')

    // And one stop only: the next Tab is out of the face altogether.
    await user.tab()
    expect(document.activeElement).not.toHaveProperty('ariaLabel', '50 minutes')
  })

  it('moves the hand an hour at a time, and the focus with it', async () => {
    const user = setup('09:45')
    screen.getByRole('button', { name: '09' }).focus()

    await user.keyboard('{ArrowUp}')
    expect(shows('10:45')).toBeDefined()
    expect(document.activeElement?.textContent).toBe('10')

    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(shows('08:45')).toBeDefined()
  })

  it('goes round the day rather than round the face, an hour on from 11 being noon', async () => {
    const user = setup('11:45')
    screen.getByRole('button', { name: '11' }).focus()

    await user.keyboard('{ArrowUp}')
    expect(shows('12:45')).toBeDefined()
    // Noon is a ring in, at the top of the face, and the focus has followed it there.
    expect(document.activeElement?.textContent).toBe('12')
  })

  it('comes round the day rather than stopping at its end', async () => {
    const user = setup('23:45')
    screen.getByRole('button', { name: '23' }).focus()

    await user.keyboard('{ArrowUp}')
    expect(shows('00:45')).toBeDefined()
  })

  it('moves the minutes one at a time, so any minute can be reached', async () => {
    const user = setup('09:45')
    await user.click(minutes())
    screen.getByRole('button', { name: '45 minutes' }).focus()

    await user.keyboard('{ArrowUp}{ArrowUp}')

    expect(shows('09:47')).toBeDefined()
    // The Tab stop lends itself to the nearest number written on the face.
    expect(document.activeElement).toHaveProperty('ariaLabel', '45 minutes')
  })

  it('takes Enter on a number as picking it', async () => {
    const user = setup('09:45')
    screen.getByRole('button', { name: '09' }).focus()

    await user.keyboard('{ArrowUp}{Enter}')

    expect(shows('10:45')).toBeDefined()
    expect(face()).toHaveProperty('ariaLabel', 'Minutes')
  })

  it('keeps the arrow keys to itself, the panel behind it not moving with them', async () => {
    const user = setup('09:45')
    screen.getByRole('button', { name: '09' }).focus()

    await user.keyboard('{ArrowUp}')
    expect(reachedPanel).toBe(0)

    // What the face has no use for still gets through: Escape is the panel's own.
    await user.keyboard('{Escape}')
    expect(reachedPanel).toBe(1)
  })
})

describe('the hour typed into the readout', () => {
  it('takes the hour and then the minutes, the typing moving on once the hour is said', async () => {
    const user = setup('09:45')

    await user.click(hour())
    await user.keyboard('0655')

    expect(shows('06:55')).toBeDefined()
    expect(document.activeElement).toBe(minutes())
    expect(face()).toHaveProperty('ariaLabel', 'Minutes')
  })

  it('moves the hand with every digit, an hour of one digit said as soon as no second could follow', async () => {
    const user = setup('09:45')

    await user.click(hour())
    await user.keyboard('1')
    expect(shows('01:45')).toBeDefined()
    expect(document.activeElement).toBe(hour())

    await user.clear(hour())
    await user.keyboard('7')
    expect(shows('07:45')).toBeDefined()
    expect(document.activeElement).toBe(minutes())
  })

  it('types over what a half held, showing it faintly until the first digit', async () => {
    const user = setup('09:45')

    await user.click(minutes())
    expect(minutes().value).toBe('')
    expect(minutes().placeholder).toBe('45')

    await user.keyboard('3')
    expect(shows('09:03')).toBeDefined()
    await user.keyboard('0')
    expect(shows('09:30')).toBeDefined()
    // A third digit starts the minutes again rather than being one too many.
    await user.keyboard('8')
    expect(shows('09:08')).toBeDefined()
  })

  it('does not take a digit that is no hour after the one before it', async () => {
    const user = setup('09:45')

    await user.click(hour())
    await user.keyboard('25')

    expect(shows('02:45')).toBeDefined()
    expect(hour().value).toBe('2')
    await user.keyboard('3')
    expect(shows('23:45')).toBeDefined()
  })

  it('takes an hour typed on an empty face, and the minutes once there is an hour to hang them on', async () => {
    const user = setup()

    await user.click(hour())
    await user.keyboard('8')
    expect(shows('08:00')).toBeDefined()
    expect(document.activeElement).toBe(minutes())

    await user.keyboard('20')
    expect(shows('08:20')).toBeDefined()
  })

  it('steps a half with Up and Down, round the day', async () => {
    const user = setup('23:59')

    await user.click(hour())
    await user.keyboard('{ArrowUp}')
    expect(shows('00:59')).toBeDefined()

    await user.click(minutes())
    await user.keyboard('{ArrowUp}')
    expect(shows('00:00')).toBeDefined()
    expect(reachedPanel).toBe(0)
  })

  it('takes Enter as the hour wanted', async () => {
    const user = setup('09:45')

    await user.click(minutes())
    await user.keyboard('15{Enter}')

    expect(shows('09:15')).toBeDefined()
    expect(submitted).toBe(1)
  })
})

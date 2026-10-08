// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SHEET_CLOSE_DISTANCE } from '../sheetDrag'
import { BottomSheet } from './BottomSheet'

afterEach(cleanup)

function renderSheet() {
  const onClose = vi.fn()
  render(
    <BottomSheet label="Details" onClose={onClose}>
      <p>Inside</p>
    </BottomSheet>,
  )
  return { onClose, handle: screen.getByRole('button', { name: 'Close' }) }
}

/** A finger pressed on the handle at the top, pulled down `by`, lingering on the last step so it lets go slowly. */
async function pull(user: ReturnType<typeof userEvent.setup>, handle: HTMLElement, by: number) {
  await user.pointer({ keys: '[TouchA>]', target: handle, coords: { clientX: 100, clientY: 0 } })
  await user.pointer({ pointerName: 'TouchA', target: handle, coords: { clientX: 100, clientY: by - 1 } })
  await new Promise((resolve) => setTimeout(resolve, 40))
  await user.pointer({ pointerName: 'TouchA', target: handle, coords: { clientX: 100, clientY: by } })
  await user.pointer({ keys: '[/TouchA]', target: handle })
}

describe('BottomSheet', () => {
  it('closes on a tap on its handle, a button a screen reader can reach (UI-48)', async () => {
    const user = userEvent.setup()
    const { onClose, handle } = renderSheet()

    await user.click(handle)

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('closes when its handle is pulled far enough down (UI-48)', async () => {
    const user = userEvent.setup()
    const { onClose, handle } = renderSheet()

    await pull(user, handle, SHEET_CLOSE_DISTANCE + 20)

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('settles back from a short, slow pull, and the pull is not taken for a tap (UI-48)', async () => {
    const user = userEvent.setup()
    const { onClose, handle } = renderSheet()

    await pull(user, handle, 30)

    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: 'Details' }).style.transform).toBe('')
  })

  it('closes on Escape and on a tap on the dimmed page (UI-9, UI-10)', async () => {
    const user = userEvent.setup()
    const { onClose } = renderSheet()

    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('dialog', { name: 'Details' }).previousElementSibling as HTMLElement)

    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('keeps a press to itself, so the row that opened it is not picked up behind it (TASK-38)', () => {
    // Drawn over the page, but a child of the row that opened it: a press there
    // would reach the row's drag and swipe as well as its own.
    const pressed = vi.fn()
    render(
      <div onMouseDown={pressed} onTouchStart={pressed}>
        <BottomSheet label="Details" onClose={vi.fn()}>
          <button type="button">Inside</button>
        </BottomSheet>
      </div>,
    )

    fireEvent.mouseDown(screen.getByRole('button', { name: 'Inside' }))
    fireEvent.touchStart(screen.getByRole('button', { name: 'Inside' }))

    expect(pressed).not.toHaveBeenCalled()
  })

  it('closes on back, so a phone’s back does not leave the app (UI-71)', async () => {
    const { onClose } = renderSheet()

    act(() => { window.history.back() })
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)))
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)))

    expect(onClose).toHaveBeenCalledOnce()
  })
})

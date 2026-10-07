import { act, screen } from '@testing-library/react'
import type userEvent from '@testing-library/user-event'

type User = ReturnType<typeof userEvent.setup>

/** Back is answered by a `popstate` a tick or two later (UI-71). */
async function goBack() {
  act(() => { window.history.back() })
  await act(() => new Promise((resolve) => setTimeout(resolve, 0)))
  await act(() => new Promise((resolve) => setTimeout(resolve, 0)))
}

/**
 * Every way out of an open `ConfirmSheet` but the button that goes ahead, for
 * `it.each`: each of them has to leave things as they were.
 */
export const WAYS_OUT: ReadonlyArray<readonly [string, (user: User) => Promise<void>]> = [
  ['Cancel', (user) => user.click(screen.getByRole('button', { name: 'Cancel' }))],
  ['Escape', (user) => user.keyboard('{Escape}')],
  // The dimmed page behind the sheet.
  ['a tap outside', (user) => user.click(screen.getByRole('dialog').previousElementSibling as HTMLElement)],
  ['back', goBack],
]

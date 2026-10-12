// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { StandingNotice } from '../standingNotices'
import { NotificationsPage } from './NotificationsPage'

/* The Notifications page. NOTIF ids refer to wiki/notifications.md. */

afterEach(cleanup)

const REMINDER: StandingNotice = { kind: 'reminder', taskId: 'a', title: 'write', at: new Date(2026, 9, 12, 14, 0) }
const DROP: StandingNotice = { kind: 'drop' }

function page(props: Partial<Parameters<typeof NotificationsPage>[0]> = {}) {
  return render(
    <NotificationsPage
      permission="granted"
      onAllow={vi.fn()}
      notices={[]}
      onOpen={vi.fn()}
      onDismiss={vi.fn()}
      {...props}
    />,
  )
}

describe('NotificationsPage', () => {
  it('says notifications are on, with nothing to press (NOTIF-2)', () => {
    page({ permission: 'granted' })

    expect(screen.getByText('Notifications are on')).toBeTruthy()
    expect(screen.getByText('Nothing reaches you while PickMe is closed.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Allow notifications' })).toBeNull()
  })

  it('asks the browser when "Allow notifications" is pressed (NOTIF-2)', async () => {
    const onAllow = vi.fn()
    page({ permission: 'default', onAllow })

    expect(screen.getByText('Notifications are not allowed yet')).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Allow notifications' }))
    expect(onAllow).toHaveBeenCalledOnce()
  })

  it('says where to unblock them, since the page cannot (NOTIF-2)', () => {
    page({ permission: 'denied' })

    expect(screen.getByText('This browser is blocking notifications')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Allow notifications' })).toBeNull()
  })

  it('says a browser without notifications has none (NOTIF-2)', () => {
    page({ permission: 'unavailable' })

    expect(screen.getByText('This browser has no notifications')).toBeTruthy()
  })

  it('says so when nothing is waiting (NOTIF-3)', () => {
    page()

    expect(screen.getByText(/Nothing is waiting/)).toBeTruthy()
  })

  it('lists each notice in its own words (NOTIF-3)', () => {
    page({ notices: [DROP, REMINDER] })

    expect(screen.getAllByRole('listitem').map((row) => row.textContent)).toEqual([
      'The Drop is here.Open Cases×',
      'Due at 14:00 · “write”Open task×',
    ])
  })

  it('opens and dismisses the notice its row stands for (NOTIF-4)', async () => {
    const onOpen = vi.fn()
    const onDismiss = vi.fn()
    page({ notices: [DROP, REMINDER], onOpen, onDismiss })

    await userEvent.click(screen.getByRole('button', { name: 'Open task' }))
    expect(onOpen).toHaveBeenCalledExactlyOnceWith(REMINDER)

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss: The Drop is here.' }))
    expect(onDismiss).toHaveBeenCalledExactlyOnceWith(DROP)
  })
})

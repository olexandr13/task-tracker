// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TimePicker } from './TimePicker'

afterEach(cleanup)

describe('TimePicker timer', () => {
  it('starts and stops a timer from the panel', async () => {
    const onStart = vi.fn()
    const onStop = vi.fn()
    const user = userEvent.setup()

    render(
      <TimePicker
        goal={60}
        sessions={[]}
        now={new Date(2026, 8, 21, 10, 0)}
        onLog={vi.fn()}
        onRemove={vi.fn()}
        onChangeGoal={vi.fn()}
        timer={{
          running: false,
          startedAt: null,
          clock: new Date(2026, 8, 21, 10, 0),
          onStart,
          onStop,
        }}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Time:/ }))
    await user.click(screen.getByRole('button', { name: 'Start timer' }))
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('shows Stop and the live clock while running', async () => {
    const onStop = vi.fn()
    const user = userEvent.setup()

    render(
      <TimePicker
        goal={60}
        sessions={[]}
        now={new Date(2026, 8, 21, 10, 0)}
        onLog={vi.fn()}
        onRemove={vi.fn()}
        onChangeGoal={vi.fn()}
        timer={{
          running: true,
          startedAt: '2026-09-21T10:00:00.000Z',
          clock: new Date('2026-09-21T10:01:30.000Z'),
          onStart: vi.fn(),
          onStop,
        }}
      />,
    )

    await user.click(screen.getByRole('button', { name: /timer running/i }))
    expect(screen.getByRole('button', { name: 'Stop' })).toBeTruthy()
    expect(screen.getByText('1:30')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Stop' }))
    expect(onStop).toHaveBeenCalledTimes(1)
    expect(onStop).toHaveBeenCalledWith(null)
  })

  it('logs the comment typed with the run on Stop (TIME-23)', async () => {
    const onStop = vi.fn()
    const user = userEvent.setup()
    render(
      <TimePicker
        goal={null}
        sessions={[]}
        now={new Date(2026, 8, 21, 10, 0)}
        onLog={vi.fn()}
        onRemove={vi.fn()}
        onChangeGoal={vi.fn()}
        timer={{
          running: true,
          startedAt: '2026-09-21T10:00:00.000Z',
          clock: new Date('2026-09-21T10:01:30.000Z'),
          onStart: vi.fn(),
          onStop,
        }}
      />,
    )

    await user.click(screen.getByRole('button', { name: /timer running/i }))
    await user.type(screen.getByRole('textbox', { name: 'Comment on the time logged' }), 'drafted intro')
    await user.click(screen.getByRole('button', { name: 'Stop' }))
    expect(onStop).toHaveBeenCalledWith('drafted intro')
  })
})

describe('TimePicker panel', () => {
  const NOW = new Date(2026, 8, 21, 10, 0)
  const logged = [{ id: 'a', seconds: 20 * 60, loggedAt: NOW.toISOString(), comment: null }]

  function renderPicker(goal: number | null, onLog = vi.fn()) {
    const user = userEvent.setup()
    render(
      <TimePicker
        goal={goal}
        sessions={logged}
        now={NOW}
        onLog={onLog}
        onRemove={vi.fn()}
        onChangeGoal={vi.fn()}
      />,
    )
    return user
  }

  it('says how the time stands and what is left (TIME-21)', async () => {
    const user = renderPicker(60)
    await user.click(screen.getByRole('button', { name: /Time:/ }))
    expect(screen.getByText('40m left')).toBeTruthy()
    expect(screen.getByRole('progressbar', { name: 'Toward the goal' }).getAttribute('aria-valuenow')).toBe('20')
  })

  it('says the goal is reached once the time is in (TIME-5)', async () => {
    const user = renderPicker(20)
    await user.click(screen.getByRole('button', { name: /Time:/ }))
    expect(screen.getByText(/Goal reached/)).toBeTruthy()
    expect(screen.queryByText(/left$/)).toBeNull()
  })

  it('logs a typed length from Log as well as Enter (TIME-3)', async () => {
    const onLog = vi.fn()
    const user = renderPicker(null, onLog)
    await user.click(screen.getByRole('button', { name: /Time:/ }))

    const log = screen.getByRole('button', { name: 'Log' })
    expect(log.hasAttribute('disabled')).toBe(true)

    await user.type(screen.getByRole('textbox', { name: 'Time to log' }), '25m')
    await user.click(log)
    expect(onLog).toHaveBeenCalledWith(25, null)
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'Time to log' }).value).toBe('')
  })

  it('logs the comment typed with the next session, quick or typed, and then lets it go (TIME-23)', async () => {
    const onLog = vi.fn()
    const user = renderPicker(null, onLog)
    await user.click(screen.getByRole('button', { name: /Time:/ }))
    const comment = screen.getByRole<HTMLInputElement>('textbox', { name: 'Comment on the time logged' })

    await user.type(comment, ' read chapter 3 ')
    await user.click(screen.getByRole('button', { name: 'Log 15m' }))
    expect(onLog).toHaveBeenLastCalledWith(15, 'read chapter 3')
    expect(comment.value).toBe('')

    await user.click(screen.getByRole('button', { name: 'Log 5m' }))
    expect(onLog).toHaveBeenLastCalledWith(5, null)

    await user.type(screen.getByRole('textbox', { name: 'Time to log' }), '25m')
    await user.type(comment, 'notes{Enter}')
    expect(onLog).toHaveBeenLastCalledWith(25, 'notes')
    expect(onLog).toHaveBeenCalledTimes(3)
  })

  it('logs nothing on Enter in the comment with no length typed (TIME-23)', async () => {
    const onLog = vi.fn()
    const user = renderPicker(null, onLog)
    await user.click(screen.getByRole('button', { name: /Time:/ }))

    await user.type(screen.getByRole('textbox', { name: 'Comment on the time logged' }), 'notes{Enter}')
    expect(onLog).not.toHaveBeenCalled()
  })

  it('shows each session’s comment in the list (TIME-23)', async () => {
    const user = userEvent.setup()
    render(
      <TimePicker
        goal={null}
        sessions={[{ ...logged[0]!, comment: 'read chapter 3' }]}
        now={NOW}
        onLog={vi.fn()}
        onRemove={vi.fn()}
        onChangeGoal={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: /Time:/ }))

    expect(screen.getByRole('list', { name: 'Sessions' }).textContent).toContain('read chapter 3')
  })

  it('says what would do when a typed length cannot be read (TIME-11)', async () => {
    const onLog = vi.fn()
    const user = renderPicker(null, onLog)
    await user.click(screen.getByRole('button', { name: /Time:/ }))

    const box = screen.getByRole('textbox', { name: 'Time to log' })
    await user.type(box, 'soon')
    await user.click(screen.getByRole('button', { name: 'Log' }))
    expect(onLog).not.toHaveBeenCalled()
    expect(box.getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByText(/Try 25m/)).toBeTruthy()

    await user.type(box, 'x')
    expect(screen.queryByText(/Try 25m/)).toBeNull()
  })

  it('keeps what the box understands behind the i, and the panel open under its sheet (TIME-11)', async () => {
    const user = renderPicker(null)
    await user.click(screen.getByRole('button', { name: /Time:/ }))

    const box = screen.getByRole('textbox', { name: 'Time to log' })
    expect(box.getAttribute('placeholder')).toBeNull()
    expect(box.getAttribute('title')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'About Log time' }))
    const sheet = screen.getByRole('dialog', { name: 'Logging time' })
    expect(within(sheet).getByText('1h30')).toBeDefined()
    expect(within(sheet).getByText(/Press "\+5m", "\+15m", "\+30m" or "\+1h"/)).toBeDefined()

    await user.click(within(sheet).getByText('Hours and minutes, written as on a clock.'))
    expect(screen.getByRole('dialog', { name: 'Logging time' })).toBeDefined()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Logging time' })).toBeNull()
    expect(screen.getByRole('textbox', { name: 'Time to log' })).toBeDefined()
  })
})

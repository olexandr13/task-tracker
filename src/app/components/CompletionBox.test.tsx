// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CompletionBox } from './CompletionBox'

const TASK = 'stretch'

function box(name = `Mark "${TASK}" as done`) {
  return screen.getByRole('button', { name })
}

interface Watchers {
  onComplete: ReturnType<typeof vi.fn>
  onUncomplete: ReturnType<typeof vi.fn>
}

function setup(props: { done?: boolean; ready?: boolean; today?: boolean } = {}): Watchers {
  const watchers = { onComplete: vi.fn(), onUncomplete: vi.fn() }
  render(<CompletionBox title={TASK} done={false} {...props} {...watchers} />)
  return watchers
}

const originalMatchMedia = window.matchMedia

/** A device asking for less motion, which jsdom has no answer of its own for. */
function askForLessMotion() {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({ matches: query.includes('prefers-reduced-motion'), media: query }),
  })
}

afterEach(() => {
  cleanup()
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: originalMatchMedia })
})

describe('ticking a task off (UI-65)', () => {
  it('shows the tick where it was clicked before the task is really done', async () => {
    const user = userEvent.setup()
    const { onComplete } = setup()

    await user.click(box())

    // The box reads as done and plays its flourish, while the task is untouched —
    // which is what holds the row in its place in the list until the tick lands.
    const ticked = box(`Mark "${TASK}" as not done`)
    expect(ticked.className).toContain('completion-box-landing')
    expect(ticked.getAttribute('aria-pressed')).toBe('true')
    expect(onComplete).not.toHaveBeenCalled()

    await waitFor(() => { expect(onComplete).toHaveBeenCalledTimes(1) })
    expect(box(`Mark "${TASK}" as done`).className).not.toContain('completion-box-landing')
  })

  it('takes back a tick that has not landed, leaving the task alone', async () => {
    const user = userEvent.setup()
    const { onComplete, onUncomplete } = setup()

    await user.click(box())
    await user.click(box(`Mark "${TASK}" as not done`))

    expect(box().className).not.toContain('completion-box-landing')
    await new Promise((settle) => setTimeout(settle, 700))
    expect(onComplete).not.toHaveBeenCalled()
    expect(onUncomplete).not.toHaveBeenCalled()
  })

  it('takes a tick back at once, with no flourish: undoing is quiet', async () => {
    const user = userEvent.setup()
    const { onUncomplete } = setup({ done: true })

    await user.click(box(`Mark "${TASK}" as not done`))

    expect(onUncomplete).toHaveBeenCalledTimes(1)
    expect(box(`Mark "${TASK}" as not done`).className).not.toContain('completion-box-landing')
  })

  it('ticks the task off as it is clicked where the device asks for less motion', async () => {
    askForLessMotion()
    const user = userEvent.setup()
    const { onComplete } = setup()

    await user.click(box())

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(box().className).not.toContain('completion-box-landing')
  })

  it('pays the completion it owes when the box leaves the screen mid-flight', async () => {
    const user = userEvent.setup()
    const watchers = { onComplete: vi.fn(), onUncomplete: vi.fn() }
    const view = render(<CompletionBox title={TASK} done={false} {...watchers} />)

    await user.click(box())
    view.unmount()

    expect(watchers.onComplete).toHaveBeenCalledTimes(1)
  })
})

describe('what a completion box is called and how it is drawn', () => {
  it('names its task, and says a time goal is reached where it is (UI-12, TIME-5)', () => {
    setup({ ready: true })

    const ready = box(`Mark "${TASK}" as done: its time goal is reached`)
    expect(ready.className).toContain('border-green-600')
    expect(ready.className).not.toContain('bg-green-600')
    expect(ready.getAttribute('title')).toBe('Time goal reached: ready to tick off')
  })

  it("speaks for today on a habit's card (HAB-24)", () => {
    setup({ today: true })

    expect(box(`Mark "${TASK}" as done today`)).toBeDefined()
  })

  it('is filled green when done and plain while still to do', () => {
    setup({ done: true })

    expect(box(`Mark "${TASK}" as not done`).className).toContain('bg-green-600')
  })
})

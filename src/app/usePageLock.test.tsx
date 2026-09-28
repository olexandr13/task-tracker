// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BarPanel } from './components/BarPanel'
import { BottomSheet } from './components/BottomSheet'

/* The page held still under a sheet or a panel (usePageLock), and let go after. UI ids refer to wiki/interface.md. */

afterEach(() => {
  cleanup()
  document.body.style.overflow = ''
})

describe('page scroll under sheets and panels', () => {
  it('holds the page still under a sheet and lets it scroll again after (UI-48)', () => {
    const { unmount } = render(
      <BottomSheet label="Details" onClose={vi.fn()}>
        <p>Inside</p>
      </BottomSheet>,
    )
    expect(document.body.style.overflow).toBe('hidden')

    unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('lets the page scroll again when a sheet and the sheet inside it close together (UI-64, UI-68)', () => {
    const { unmount } = render(
      <BottomSheet label="Details" onClose={vi.fn()}>
        <BottomSheet label="Schedule" onClose={vi.fn()}>
          <p>Inside</p>
        </BottomSheet>
      </BottomSheet>,
    )
    expect(document.body.style.overflow).toBe('hidden')

    unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('keeps the page still while one of two is left, whichever closes first (UI-64, UI-68)', () => {
    const outer = render(
      <BottomSheet label="Details" onClose={vi.fn()}>
        <p>Inside</p>
      </BottomSheet>,
    )
    const inner = render(
      <BarPanel top={600} role="menu" label="Tasks" onClose={vi.fn()}>
        <p>Inside</p>
      </BarPanel>,
    )

    outer.unmount()
    expect(document.body.style.overflow).toBe('hidden')

    inner.unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('gives back the overflow the page had before (UI-68)', () => {
    document.body.style.overflow = 'auto'
    const { unmount } = render(
      <BottomSheet label="Details" onClose={vi.fn()}>
        <p>Inside</p>
      </BottomSheet>,
    )
    expect(document.body.style.overflow).toBe('hidden')

    unmount()
    expect(document.body.style.overflow).toBe('auto')
  })
})

// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { STORAGE_PROBLEM_LABELS } from '../storageProblem'
import { StorageProblemNotice } from './StorageProblemNotice'

/* A refused load or save, said on screen. STORE ids refer to wiki/storage.md. */

afterEach(cleanup)

describe('StorageProblemNotice (STORE-13)', () => {
  it('says what was refused, as an alert', () => {
    render(<StorageProblemNotice problem="save" onDismiss={() => undefined} />)

    expect(screen.getByRole('alert').textContent).toContain(STORAGE_PROBLEM_LABELS.save)
  })

  it('goes when dismissed', async () => {
    const onDismiss = vi.fn()
    render(<StorageProblemNotice problem="load" onDismiss={onDismiss} />)

    await userEvent.setup().click(screen.getByRole('button', { name: 'Dismiss' }))

    expect(onDismiss).toHaveBeenCalledOnce()
  })
})

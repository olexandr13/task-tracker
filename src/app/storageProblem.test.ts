import { describe, expect, it } from 'vitest'
import { worseProblem } from './storageProblem'

/* Which refusal the screen owns up to. STORE ids refer to wiki/storage.md. */

describe('worseProblem (STORE-13)', () => {
  it('takes the only one there is', () => {
    expect(worseProblem(null, 'save')).toBe('save')
    expect(worseProblem(null, 'load')).toBe('load')
  })

  it('lets a failed load outrank a failed save, whichever came first', () => {
    expect(worseProblem('save', 'load')).toBe('load')
    expect(worseProblem('load', 'save')).toBe('load')
  })
})

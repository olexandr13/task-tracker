// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { LocalStorageSetting } from '../storage/localStorageSetting'
import { useDeviceSetting } from './useDeviceSetting'

/* A setting kept on this device (STORE-30, STORE-31, STORE-57 in wiki/storage.md). */

afterEach(cleanup)

function repository<T>(saved: T) {
  const save = vi.fn<(value: T) => void>()
  const setting: LocalStorageSetting<T> = { load: () => saved, save }
  return { setting, save }
}

describe('useDeviceSetting', () => {
  it('starts from what was saved, and saves each change', () => {
    const { setting, save } = repository({ open: true })
    const { result } = renderHook(() => useDeviceSetting(setting))

    expect(result.current[0]).toEqual({ open: true })
    act(() => { result.current[1]({ open: false }) })

    expect(result.current[0]).toEqual({ open: false })
    expect(save).toHaveBeenLastCalledWith({ open: false })
  })

  it('builds two changes in one go each on the one before (STORE-39)', () => {
    const { setting, save } = repository<Record<string, boolean>>({})
    const { result } = renderHook(() => useDeviceSetting(setting))

    act(() => {
      const change = result.current[1]
      change((latest) => ({ ...latest, habits: true }))
      change((latest) => ({ ...latest, cases: true }))
    })

    expect(result.current[0]).toEqual({ habits: true, cases: true })
    expect(save).toHaveBeenLastCalledWith({ habits: true, cases: true })
  })
})

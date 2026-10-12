// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLocalStorageSetting, type LocalStorageSetting } from '../storage/localStorageSetting'
import { useDeviceSetting } from './useDeviceSetting'

/* A setting kept on this device (STORE-30, STORE-31, STORE-57, STORE-61 in wiki/storage.md). */

afterEach(() => {
  cleanup()
  localStorage.clear()
})

function repository<T>(saved: T) {
  const save = vi.fn<(value: T) => void>()
  const setting: LocalStorageSetting<T> = { load: () => saved, save, subscribe: () => () => {} }
  return { setting, save }
}

/** A list of names kept in this browser, as the pinned tabs are. */
const KEY = 'task-tracker/test-setting'
const names = createLocalStorageSetting<string[]>({
  key: KEY,
  read: (data) => (Array.isArray(data) ? data.map(String) : null),
  write: (value) => value,
  fallback: [],
})

/** Another window of the app saving `value`: written to the browser, and this window told. */
function savedElsewhere(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new StorageEvent('storage', { key, storageArea: localStorage }))
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

  it('follows what another window saves, and builds the next change on it (STORE-61)', () => {
    names.save(['today'])
    const { result } = renderHook(() => useDeviceSetting(names))

    act(() => { savedElsewhere(KEY, ['today', 'journal']) })
    expect(result.current[0]).toEqual(['today', 'journal'])

    act(() => { result.current[1]((latest) => [...latest, 'habits']) })
    expect(names.load()).toEqual(['today', 'journal', 'habits'])
  })

  it('leaves the setting alone when another window saves something else', () => {
    names.save(['today'])
    const { result } = renderHook(() => useDeviceSetting(names))
    const before = result.current[0]

    act(() => { savedElsewhere('task-tracker/theme', { version: 1, theme: 'dark' }) })

    expect(result.current[0]).toBe(before)
  })
})

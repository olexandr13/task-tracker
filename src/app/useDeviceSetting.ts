import { useCallback, useEffect, useRef, useState } from 'react'
import type { LocalStorageSetting } from '../storage/localStorageSetting'

/** A new value for a setting, or how to make one from the latest. */
export type DeviceSettingChange<T> = T | ((latest: T) => T)

/**
 * A setting kept on this device (../storage/deviceStorage) — how the task views,
 * the habits or the sidebar are shown — read when the screen opens and saved
 * on every change.
 *
 * A change can be worked out from the latest value rather than the one the
 * caller last drew, so two changes in one go each build on the one before
 * (STORE-39): folding two parts of Settings at once keeps both.
 *
 * What another window of the app saves is read again here as it lands
 * (STORE-61), so a change made here builds on it: a window opened before the app
 * was updated, pinning a tab, keeps the tabs pinned since in the new one rather
 * than writing the ones it opened with over them.
 */
export function useDeviceSetting<T>(repository: LocalStorageSetting<T>): [T, (next: DeviceSettingChange<T>) => void] {
  const [value, setValue] = useState(() => repository.load())
  const latest = useRef(value)

  const change = useCallback(
    (next: DeviceSettingChange<T>) => {
      const changed = typeof next === 'function' ? (next as (latest: T) => T)(latest.current) : next
      latest.current = changed
      setValue(changed)
      repository.save(changed)
    },
    [repository],
  )

  useEffect(
    () =>
      repository.subscribe(() => {
        const saved = repository.load()
        latest.current = saved
        setValue(saved)
      }),
    [repository],
  )

  return [value, change]
}

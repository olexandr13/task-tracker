import { useCallback, useState } from 'react'
import type { LocalStorageSetting } from '../storage/localStorageSetting'

/**
 * A setting kept on this device (../storage/deviceStorage) — how the task views,
 * the habits or the sidebar are shown — read once when the screen opens and
 * saved on every change.
 */
export function useDeviceSetting<T>(repository: LocalStorageSetting<T>): [T, (next: T) => void] {
  const [value, setValue] = useState(() => repository.load())

  const change = useCallback(
    (next: T) => {
      setValue(next)
      repository.save(next)
    },
    [repository],
  )

  return [value, change]
}

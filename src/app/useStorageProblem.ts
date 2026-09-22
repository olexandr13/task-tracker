import { useCallback, useState } from 'react'
import { worseProblem, type StorageProblem } from './storageProblem'

/**
 * The problem the screen has to own up to, if any: reported by the hooks that
 * hold the account's data (STORE-13), kept until it is dismissed, the worse of
 * two winning (`worseProblem`).
 */
export function useStorageProblem() {
  const [problem, setProblem] = useState<StorageProblem | null>(null)

  const report = useCallback((next: StorageProblem) => {
    setProblem((current) => worseProblem(current, next))
  }, [])

  const dismiss = useCallback(() => { setProblem(null) }, [])

  return { problem, report, dismiss }
}

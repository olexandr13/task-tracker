import { useEffect } from 'react'
import type { Theme, ThemeRepository } from '../storage/themeRepository'
import { applyTheme } from './theme'
import { useDeviceSetting } from './useDeviceSetting'

/**
 * The theme picked on Settings (UI-63), kept on this device and worn by the
 * whole page. `index.html` already put it on before the first paint; this keeps
 * the page in it, and changes it the moment another is picked.
 */
export function useTheme(repository: ThemeRepository): [Theme, (next: Theme) => void] {
  const [theme, setTheme] = useDeviceSetting(repository)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  return [theme, setTheme]
}

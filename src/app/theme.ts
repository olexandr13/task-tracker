import type { Theme } from '../storage/themeRepository'

/**
 * The browser's bar in each theme: the page's own background (`body` in
 * styles.css), as `index.html` sets it before any theme is picked.
 */
const BAR_COLORS = { light: '#fafafa', dark: '#0a0a0a' } as const

/**
 * Colours the whole page in `theme` (UI-63): `data-theme` on <html>, which every
 * `dark:` class follows (styles.css), and the browser's bar around the page. Left
 * at `system`, both go back to following the system.
 */
export function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'system') delete root.dataset.theme
  else root.dataset.theme = theme

  // index.html has one bar colour for a light system and one for a dark; a theme picked
  // here sets both to its own, so the bar matches the page whichever the system is.
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    const systems = (meta.getAttribute('media') ?? '').includes('dark') ? 'dark' : 'light'
    meta.content = BAR_COLORS[theme === 'system' ? systems : theme]
  }
}

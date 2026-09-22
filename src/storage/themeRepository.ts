/**
 * How the app is coloured: as the system is set — light or dark, following it
 * when it changes — or always light, or always dark.
 */
export type Theme = 'system' | 'light' | 'dark'

/** Every theme, in the order Settings offers them. */
export const THEMES: readonly Theme[] = ['system', 'light', 'dark']

/** Until the owner picks one, the app follows the system. */
export const DEFAULT_THEME: Theme = 'system'

/**
 * Where the theme is kept between visits.
 *
 * It belongs to the device rather than the account, as the View options do: a
 * phone kept dark and a desktop kept light are each set their own way. Kept in
 * the browser, it is there before the page is first drawn (see `index.html`),
 * so the app never opens in the other theme for a moment.
 */
export interface ThemeRepository {
  load(): Theme
  save(theme: Theme): void
}

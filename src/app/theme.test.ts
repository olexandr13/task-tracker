// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import indexHtml from '../../index.html?raw'
import viteConfig from '../../vite.config.ts?raw'
import { localStorageThemeRepository } from '../storage/localStorageThemeRepository'
import { applyTheme } from './theme'

/* The theme worn by the page (UI-63 in wiki/interface.md, STORE-40 in wiki/storage.md). */

/** The script `index.html` runs before the page is first drawn. */
const bootScript = /<script>([\s\S]*?)<\/script>/.exec(indexHtml)?.[1] ?? ''

/** The theme-color tags as `index.html` has them. */
function addBarColors() {
  document.head.innerHTML = [...indexHtml.matchAll(/<meta name="theme-color"[^>]*>/g)].map(([tag]) => tag).join('')
}

function barColors() {
  return [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')].map((meta) => meta.content)
}

beforeEach(addBarColors)

afterEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
  document.head.innerHTML = ''
})

describe('applyTheme', () => {
  it('puts a picked theme on the page and the browser bar in its colour', () => {
    applyTheme('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(barColors()).toEqual(['#fafafa', '#fafafa'])

    applyTheme('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(barColors()).toEqual(['#0a0a0a', '#0a0a0a'])
  })

  it('goes back to the system, bar included, when System is picked', () => {
    applyTheme('dark')
    applyTheme('system')

    expect(document.documentElement.dataset.theme).toBeUndefined()
    expect(barColors()).toEqual(['#fafafa', '#0a0a0a'])
  })
})

describe('the installed app', () => {
  // Chrome on Android in dark mode paints an installed app's status bar in the manifest's theme
  // colour whatever the page's tags say (OFF-10), so the manifest names none and Chrome follows
  // the phone's light or dark mode instead.
  it('leaves the status bar to the phone rather than one fixed colour', () => {
    expect(viteConfig).toContain('theme_color: undefined,')
  })

  it('opens on the light page colour', () => {
    applyTheme('light')
    const [light] = barColors()

    expect(viteConfig).toContain(`background_color: '${light}'`)
  })
})

describe('the script in index.html', () => {
  function runBootScript() {
    new Function(bootScript)()
  }

  it('is there', () => {
    expect(bootScript).toContain('localStorage')
  })

  it('reads back the theme as it is saved, before the app starts', () => {
    localStorageThemeRepository.save('light')
    runBootScript()
    expect(document.documentElement.dataset.theme).toBe('light')

    localStorageThemeRepository.save('dark')
    runBootScript()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('leaves the page to the system when nothing is picked, or what is saved cannot be read', () => {
    localStorageThemeRepository.save('system')
    runBootScript()
    expect(document.documentElement.dataset.theme).toBeUndefined()

    localStorage.setItem('task-tracker/theme', '{not json')
    runBootScript()
    expect(document.documentElement.dataset.theme).toBeUndefined()
  })
})

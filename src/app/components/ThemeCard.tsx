import { useId } from 'react'
import { THEMES, type Theme } from '../../storage/themeRepository'

const LABELS: Record<Theme, string> = { system: 'System', light: 'Light', dark: 'Dark' }

/** A segment of the control; its radio is the one it wears the focus ring for. */
const segment =
  'flex min-h-10 cursor-pointer items-center justify-center rounded-md px-3 text-sm text-neutral-500 transition-colors outline-offset-2 hover:text-neutral-900 has-checked:bg-white has-checked:font-medium has-checked:text-neutral-900 has-checked:shadow-sm has-focus-visible:outline-2 has-focus-visible:outline-blue-500 md:min-h-8 dark:text-neutral-400 dark:hover:text-neutral-100 dark:has-checked:bg-neutral-700 dark:has-checked:text-neutral-100'

interface ThemeCardProps {
  theme: Theme
  onChange: (theme: Theme) => void
}

/**
 * The theme, on Settings (UI-63): one control of three segments, one of them
 * always chosen. Each is a real radio behind its label, so the arrow keys move
 * along them as in any radio group, and the page changes as they do.
 */
export function ThemeCard({ theme, onChange }: ThemeCardProps) {
  const name = useId()
  const headingId = useId()

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col rounded-xl border border-neutral-200 bg-white px-4 py-3.5 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <h2 id={headingId} className="text-sm font-medium">
        Theme
      </h2>
      <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
        System follows this device’s light or dark mode. Kept on this device only.
      </p>

      <div
        role="radiogroup"
        aria-labelledby={headingId}
        className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-neutral-100 p-1 md:max-w-xs dark:bg-neutral-800"
      >
        {THEMES.map((value) => (
          <label key={value} className={segment}>
            <input
              type="radio"
              name={name}
              value={value}
              checked={theme === value}
              onChange={() => { onChange(value) }}
              className="sr-only"
            />
            {LABELS[value]}
          </label>
        ))}
      </div>
    </section>
  )
}

import { useId, type ReactNode } from 'react'
import { ChevronIcon } from './ChevronIcon'
import { InfoButton } from './InfoButton'

interface SettingsSectionProps {
  title: string
  /** What the **i** beside the title says (UI-73); left out, there is none. */
  info?: ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

/**
 * One section of Settings (UI-35): a card whose heading folds it away and
 * brings it back. The whole heading row is the button, so it is one easy
 * target, with the chevron in front of the name turned down while it is open.
 * The **i**, where there is one, sits above that row and opens its own sheet.
 *
 * Folded, only the heading is left: what is in it is not drawn at all, so a
 * folded section is not read out either.
 */
export function SettingsSection({ title, info, open, onOpenChange, children }: SettingsSectionProps) {
  const headingId = useId()
  const bodyId = useId()

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="relative flex min-h-12 items-center gap-1.5 px-4">
        <h2 id={headingId} className="text-sm font-medium">
          <button
            type="button"
            onClick={() => { onOpenChange(!open) }}
            aria-expanded={open}
            aria-controls={open ? bodyId : undefined}
            className="group flex items-center gap-2 py-3 text-left outline-none after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-blue-500"
          >
            <ChevronIcon
              className={`size-4 shrink-0 text-neutral-400 transition-transform group-hover:text-neutral-700 dark:group-hover:text-neutral-200 ${open ? '' : '-rotate-90'}`}
            />
            {title}
          </button>
        </h2>
        {info !== undefined && (
          // Above the heading's button, which reaches across the whole row.
          <span className="relative z-[1] flex">
            <InfoButton label={title}>{info}</InfoButton>
          </span>
        )}
      </div>

      {open && (
        <div id={bodyId} className="px-4 pb-3.5">
          {children}
        </div>
      )}
    </section>
  )
}

import { Fragment } from 'react'
import { VIEW_LABELS, type View } from '../view'
import { VIEW_ICONS } from '../viewIcons'

/**
 * The views, grouped: the lists named after a period, then every task and the
 * habits, then the trash, then settings. A thin line is drawn between groups.
 */
const VIEW_GROUPS: readonly (readonly View[])[] = [
  ['today', 'week', 'month'],
  ['tasks', 'habits'],
  ['trash'],
  ['settings'],
]

const item = 'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors'
const itemOn = 'bg-neutral-200/70 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
const itemOff =
  'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100'

interface SideNavProps {
  view: View
  onChange: (view: View) => void
}

/**
 * Which screen you are on: a plain list down the left. Only where there is room
 * for one — a phone gets the bar along the bottom instead (BottomNav).
 */
export function SideNav({ view, onChange }: SideNavProps) {
  return (
    <nav aria-label="Views" className="hidden md:block md:w-44 md:shrink-0">
      <ul className="flex flex-col gap-0.5">
        {VIEW_GROUPS.map((group, index) => (
          <Fragment key={group[0]}>
            {index > 0 && (
              <li aria-hidden="true" className="mx-3 my-1.5 border-t border-neutral-200 dark:border-neutral-800" />
            )}
            {group.map((value) => (
              <NavItem key={value} value={value} active={value === view} onSelect={onChange} />
            ))}
          </Fragment>
        ))}
      </ul>
    </nav>
  )
}

function NavItem({ value, active, onSelect }: { value: View; active: boolean; onSelect: (view: View) => void }) {
  const Icon = VIEW_ICONS[value]

  return (
    <li>
      <button
        type="button"
        onClick={() => { onSelect(value) }}
        aria-current={active ? 'page' : undefined}
        className={active ? `${item} ${itemOn}` : `${item} ${itemOff}`}
      >
        <Icon />
        {VIEW_LABELS[value]}
      </button>
    </li>
  )
}

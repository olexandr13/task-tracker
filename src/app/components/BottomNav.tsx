import { useState, type ComponentProps } from 'react'
import { useLongPress } from '../useLongPress'
import { isPeriodView, isUnder, PERIOD_VIEWS, VIEW_LABELS, type FixedView, type PeriodView, type View } from '../view'
import { VIEW_ICONS } from '../viewIcons'
import { ContextMenu } from './ContextMenu'

interface BottomNavProps {
  view: View
  onChange: (view: View) => void
}

/** Where the period menu opens: its corner this far in from the tab's, and just clear of its top. */
const MENU_INSET = 8
const MENU_GAP = 4

const tab =
  'flex w-full flex-col items-center gap-1 pt-2 pb-2.5 text-[11px] leading-none transition-colors select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none]'
const tabOn = 'font-medium text-neutral-900 dark:text-neutral-100'
const tabOff = 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
const pill = 'flex h-7 w-12 items-center justify-center rounded-full transition-colors'
const pillOn = 'bg-neutral-200/80 dark:bg-neutral-800'

/**
 * A phone's navigation: a bar along the bottom, in reach of a thumb, where the
 * sidebar would be on a wide screen.
 *
 * Today, Week and Month share the first tab, which shows the one last chosen and
 * goes to it on a tap; holding it down opens a menu to switch. The rewards, the
 * lists, the tags and the trash have no tab — they are reached from the bottom of
 * Tasks, so Tasks stays marked while any of them is open, or one list, the Inbox
 * or a tag's tasks.
 */
export function BottomNav({ view, onChange }: BottomNavProps) {
  // The period the first tab goes back to after leaving it: the last one on
  // screen, Today to begin with.
  const [period, setPeriod] = useState<PeriodView>(isPeriodView(view) ? view : 'today')
  if (isPeriodView(view) && view !== period) {
    setPeriod(view)
  }

  const [menuAt, setMenuAt] = useState<{ x: number; y: number; fromKeyboard: boolean } | null>(null)

  const periodPress = useLongPress<HTMLButtonElement>({
    onPress: () => { onChange(period) },
    onLongPress: (button, fromKeyboard) => {
      const { left, top } = button.getBoundingClientRect()
      setMenuAt({ x: left + MENU_INSET, y: top - MENU_GAP, fromKeyboard })
    },
  })

  return (
    <>
      <nav
        aria-label="Views"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/95 backdrop-blur md:hidden dark:border-neutral-800 dark:bg-neutral-900/95"
      >
        <ul className="mx-auto grid max-w-md grid-cols-4">
          <li>
            <Tab
              value={period}
              active={isPeriodView(view)}
              description="Hold to switch between Today, Week and Month"
              {...periodPress}
            />
          </li>
          <li>
            <Tab value="habits" active={view === 'habits'} onClick={() => { onChange('habits') }} />
          </li>
          <li>
            <Tab
              value="tasks"
              active={
                view === 'tasks' ||
                view === 'rewards' ||
                isUnder(view, 'trash') ||
                isUnder(view, 'lists') ||
                isUnder(view, 'tags')
              }
              onClick={() => { onChange('tasks') }}
            />
          </li>
          <li>
            <Tab value="settings" active={view === 'settings'} onClick={() => { onChange('settings') }} />
          </li>
        </ul>
      </nav>

      {/* Outside the bar: its blur would hold the menu's fixed position to the bar instead of the window. */}
      {menuAt !== null && (
        <ContextMenu
          x={menuAt.x}
          y={menuAt.y}
          label="Period"
          fromKeyboard={menuAt.fromKeyboard}
          items={PERIOD_VIEWS.map((value) => ({ label: VIEW_LABELS[value], onSelect: () => { onChange(value) } }))}
          onClose={() => { setMenuAt(null) }}
        />
      )}
    </>
  )
}

type TabProps = { value: FixedView; active: boolean; description?: string } & Omit<
  ComponentProps<'button'>,
  'value' | 'type' | 'className' | 'children'
>

function Tab({ value, active, description, ...handlers }: TabProps) {
  const Icon = VIEW_ICONS[value]

  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      aria-description={description}
      className={`${tab} ${active ? tabOn : tabOff}`}
      {...handlers}
    >
      <span className={active ? `${pill} ${pillOn}` : pill}>
        <Icon className="size-5 shrink-0" />
      </span>
      {VIEW_LABELS[value]}
    </button>
  )
}

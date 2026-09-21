import { useRef, useState, type ComponentProps } from 'react'
import { sortLists, type List } from '../../core'
import { useLongPress } from '../useLongPress'
import {
  isPeriodView,
  isUnder,
  oneListView,
  PERIOD_VIEWS,
  VIEW_LABELS,
  type FixedView,
  type PeriodView,
  type View,
} from '../view'
import { VIEW_ICONS, type ViewIcon } from '../viewIcons'
import { ContextMenu, type ContextMenuEntry, type ContextMenuItem } from './ContextMenu'

interface BottomNavProps {
  view: View
  /** Every list there is, to go to from the Tasks tab's menu. */
  lists: readonly List[]
  /** Soften the bar while Procrastination mode is on (JUST-5). */
  dimmed?: boolean
  onChange: (view: View) => void
}

/** Where a tab's menu opens: its corner this far in from the tab's, and just clear of its top. */
const MENU_INSET = 8
const MENU_GAP = 4

const tab =
  'flex w-full touch-manipulation flex-col items-center gap-1 pt-2 pb-2.5 text-[11px] leading-none transition-colors select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none]'
const tabOn = 'font-medium text-neutral-900 dark:text-neutral-100'
const tabOff = 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
const pill = 'flex h-7 w-12 items-center justify-center rounded-full transition-colors'
const pillOn = 'bg-neutral-200/80 dark:bg-neutral-800'
const pillOff = 'hover:bg-neutral-100 dark:hover:bg-neutral-800'

/** The tabs that open a menu of their own. */
type TabMenu = 'period' | 'tasks'

type TabPress = ReturnType<typeof useLongPress<HTMLButtonElement>>

/**
 * A phone's navigation: a bar along the bottom, in reach of a thumb, where the
 * sidebar would be on a wide screen.
 *
 * Today, Week and Month share the first tab, which shows the one last chosen and
 * goes to it on a tap. The lists and the trash have no tab — they are reached from
 * Tasks, so Tasks stays marked while either is open, or one list or the Inbox. The
 * tags and the rewards have none either: they are under More, which goes to its
 * own page on a tap and stays marked while that page, the Tags page, a tag's
 * tasks or the Rewards page is open.
 *
 * The period tab and Tasks each have a menu of what the sidebar has in their
 * place: the three periods, and Lists with the Inbox and every list indented
 * under it, then the trash. Holding the tab opens it, and so does tapping it
 * again once its page is on screen, a tap there having nowhere further to go —
 * so a double tap opens it from anywhere. A tap on a tab while its menu is open
 * closes it. A tab stays marked while its menu is open, so it is plain which tab
 * the menu belongs to.
 */
export function BottomNav({ view, lists, dimmed = false, onChange }: BottomNavProps) {
  // The period the first tab goes back to after leaving it: the last one on
  // screen, Today to begin with.
  const [period, setPeriod] = useState<PeriodView>(isPeriodView(view) ? view : 'today')
  if (isPeriodView(view) && view !== period) {
    setPeriod(view)
  }

  const [menu, setMenu] = useState<{
    of: TabMenu
    x: number
    y: number
    align: 'left' | 'right'
    fromKeyboard: boolean
  } | null>(null)

  function openMenu(of: TabMenu, button: HTMLElement, fromKeyboard: boolean) {
    const { left, top } = button.getBoundingClientRect()
    setMenu({ of, x: left + MENU_INSET, y: top - MENU_GAP, align: 'left', fromKeyboard })
  }

  // The menu that was open as a pointer came down on a tab. Coming down outside it
  // has closed it already (UI-9), so a tap on its own tab stops there rather than
  // opening it straight back.
  const openAtPress = useRef<TabMenu | null>(null)

  function noticingMenu(press: TabPress): TabPress {
    return {
      ...press,
      onPointerDown(event) {
        openAtPress.current = menu?.of ?? null
        press.onPointerDown(event)
      },
    }
  }

  /** Whether a tap is the one closing this tab's menu. A key never is: the menu has focus while open. */
  function closesMenu(of: TabMenu, fromKeyboard: boolean) {
    return !fromKeyboard && openAtPress.current === of
  }

  const periodPress = useLongPress<HTMLButtonElement>({
    onPress: (button, fromKeyboard) => {
      if (closesMenu('period', fromKeyboard)) return
      if (isPeriodView(view)) openMenu('period', button, fromKeyboard)
      else onChange(period)
    },
    onLongPress: (button, fromKeyboard) => { openMenu('period', button, fromKeyboard) },
  })

  const tasksPress = useLongPress<HTMLButtonElement>({
    onPress: (button, fromKeyboard) => {
      if (closesMenu('tasks', fromKeyboard)) return
      if (view === 'tasks') openMenu('tasks', button, fromKeyboard)
      else onChange('tasks')
    },
    onLongPress: (button, fromKeyboard) => { openMenu('tasks', button, fromKeyboard) },
  })

  const periodItems: ContextMenuEntry[] = PERIOD_VIEWS.map((value) => ({
    label: VIEW_LABELS[value],
    onSelect: () => { onChange(value) },
  }))

  /** A page's entry in a tab's menu: its name and icon, going there. */
  function pageItem(value: FixedView): ContextMenuItem {
    const Icon = VIEW_ICONS[value]
    return { label: VIEW_LABELS[value], icon: <Icon />, onSelect: () => { onChange(value) } }
  }

  // Lists with the Inbox and every list under it, as the sidebar has them, then
  // the trash below the line the sidebar draws before it.
  const InboxIcon = VIEW_ICONS.inbox
  const ListIcon = VIEW_ICONS.lists
  const tasksItems: ContextMenuEntry[] = [
    {
      ...pageItem('lists'),
      under: [
        { label: VIEW_LABELS.inbox, icon: <InboxIcon />, onSelect: () => { onChange('inbox') } },
        ...sortLists(lists).map((list) => ({
          label: list.name,
          icon: <ListIcon />,
          onSelect: () => { onChange(oneListView(list.id)) },
        })),
      ],
    },
    pageItem('trash'),
  ]

  const menus: Record<TabMenu, { label: string; items: ContextMenuEntry[] }> = {
    period: { label: 'Period', items: periodItems },
    tasks: { label: VIEW_LABELS.tasks, items: tasksItems },
  }

  return (
    <>
      <nav
        aria-label="Views"
        className={`fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/95 backdrop-blur md:hidden dark:border-neutral-800 dark:bg-neutral-900/95${dimmed ? ' opacity-25' : ''}`}
      >
        <ul className="mx-auto grid max-w-md grid-cols-5">
          <li>
            <Tab
              label={VIEW_LABELS[period]}
              icon={VIEW_ICONS[period]}
              active={isPeriodView(view) || menu?.of === 'period'}
              description="Hold, or tap again, to switch between Today, Week and Month"
              {...noticingMenu(periodPress)}
            />
          </li>
          <li>
            <Tab
              label={VIEW_LABELS.habits}
              icon={VIEW_ICONS.habits}
              active={view === 'habits'}
              onClick={() => { onChange('habits') }}
            />
          </li>
          <li>
            <Tab
              label={VIEW_LABELS.tasks}
              icon={VIEW_ICONS.tasks}
              active={view === 'tasks' || isUnder(view, 'trash') || isUnder(view, 'lists') || menu?.of === 'tasks'}
              description="Hold, or tap again, for the lists and the trash"
              {...noticingMenu(tasksPress)}
            />
          </li>
          <li>
            <Tab
              label={VIEW_LABELS.more}
              icon={VIEW_ICONS.more}
              active={isUnder(view, 'more')}
              onClick={() => { onChange('more') }}
            />
          </li>
          <li>
            <Tab
              label={VIEW_LABELS.settings}
              icon={VIEW_ICONS.settings}
              active={view === 'settings'}
              onClick={() => { onChange('settings') }}
            />
          </li>
        </ul>
      </nav>

      {/* Outside the bar: its blur would hold the menu's fixed position to the bar instead of the window. */}
      {menu !== null && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          align={menu.align}
          label={menus[menu.of].label}
          fromKeyboard={menu.fromKeyboard}
          items={menus[menu.of].items}
          onClose={() => { setMenu(null) }}
        />
      )}
    </>
  )
}

type TabProps = { label: string; icon: ViewIcon; active: boolean; description?: string } & Omit<
  ComponentProps<'button'>,
  'type' | 'className' | 'children'
>

function Tab({ label, icon: Icon, active, description, ...handlers }: TabProps) {
  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      aria-description={description}
      className={`${tab} ${active ? tabOn : tabOff}`}
      {...handlers}
    >
      <span className={active ? `${pill} ${pillOn}` : `${pill} ${pillOff}`}>
        <Icon className="size-5 shrink-0" />
      </span>
      {label}
    </button>
  )
}

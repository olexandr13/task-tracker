import type { ReactElement } from 'react'
import { CalendarIcon } from './components/CalendarIcon'
import { FlameIcon } from './components/FlameIcon'
import { ListIcon } from './components/ListIcon'
import { MonthIcon } from './components/MonthIcon'
import { SettingsIcon } from './components/SettingsIcon'
import { TrashIcon } from './components/TrashIcon'
import { WeekIcon } from './components/WeekIcon'
import type { View } from './view'

export type ViewIcon = (props: { className?: string }) => ReactElement

/** The glyph each view carries, wherever it is navigated to from: the sidebar or a phone's bar. */
export const VIEW_ICONS: Record<View, ViewIcon> = {
  today: CalendarIcon,
  week: WeekIcon,
  month: MonthIcon,
  tasks: ListIcon,
  habits: FlameIcon,
  trash: TrashIcon,
  settings: SettingsIcon,
}
